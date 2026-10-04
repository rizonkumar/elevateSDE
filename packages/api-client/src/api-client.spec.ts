import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthResponseDto, UserDto } from '@elevatesde/shared-types';
import { createApiClient } from './api-client';

const USER: UserDto = {
  id: 'user-1',
  tenantId: null,
  email: 'candidate@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  headline: null,
  role: 'USER',
  createdAt: '2026-10-01T00:00:00.000Z',
};

interface FakeServer {
  validAccessToken: string;
  refreshCalls: number;
  refreshFails: boolean;
  failRetryWith: number | null;
}

function respond(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): Promise<AxiosResponse> {
  const response: AxiosResponse = { data, status, statusText: '', headers: {}, config };
  if (status >= 400) {
    return Promise.reject(
      new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', config, null, response),
    );
  }
  return Promise.resolve(response);
}

function buildClient(overrides: Partial<FakeServer> = {}) {
  const server: FakeServer = {
    validAccessToken: 'access-2',
    refreshCalls: 0,
    refreshFails: false,
    failRetryWith: null,
    ...overrides,
  };
  const cookies = { accessToken: 'access-1', refreshToken: 'refresh-1' };
  const state = {
    setAuth: jest.fn((_user: UserDto, accessToken: string, refreshToken?: string) => {
      cookies.accessToken = accessToken;
      cookies.refreshToken = refreshToken ?? cookies.refreshToken;
    }),
    clearAuth: jest.fn(),
  };
  const navigate = jest.fn();
  const seenAuthorization: string[] = [];

  const adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    if (config.url === '/api/v1/auth/refresh') {
      server.refreshCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      const session: AuthResponseDto = {
        accessToken: server.validAccessToken,
        refreshToken: `refresh-${server.refreshCalls + 1}`,
        user: USER,
      };
      return server.refreshFails ? respond(config, 401, null) : respond(config, 200, session);
    }
    const authorization = String(config.headers.Authorization ?? '');
    seenAuthorization.push(authorization);
    if (authorization !== `Bearer ${server.validAccessToken}`) {
      return respond(config, 401, null);
    }
    if (server.failRetryWith !== null) {
      return respond(config, server.failRetryWith, null);
    }
    return respond(config, 200, { ok: true, url: config.url });
  };

  const api = createApiClient({
    baseURL: 'http://api.test',
    session: { getState: () => state },
    loginPath: '/admin/login',
    tokens: {
      accessToken: () => cookies.accessToken,
      refreshToken: () => (cookies.refreshToken === '' ? undefined : cookies.refreshToken),
    },
    navigate,
    adapter,
  });

  return { api, server, state, navigate, cookies, seenAuthorization };
}

describe('createApiClient', () => {
  it('sends the current access token', async () => {
    const { api, seenAuthorization } = buildClient({ validAccessToken: 'access-1' });

    await api.get('/users/me');

    expect(seenAuthorization).toEqual(['Bearer access-1']);
  });

  it('refreshes once for parallel 401s and retries every request with the new token', async () => {
    const { api, server, state } = buildClient();

    const responses = await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);

    expect(server.refreshCalls).toBe(1);
    expect(responses.map((response) => response.data.url)).toEqual(['/a', '/b', '/c']);
    expect(state.setAuth).toHaveBeenCalledWith(USER, 'access-2', 'refresh-2');
    expect(state.clearAuth).not.toHaveBeenCalled();
  });

  it('ends the session and redirects to the configured login when refresh fails', async () => {
    const { api, state, navigate } = buildClient({ refreshFails: true });

    await expect(api.get('/a')).rejects.toBeInstanceOf(AxiosError);

    expect(state.clearAuth).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/admin/login');
  });

  it('keeps the session when the retried request fails for another reason', async () => {
    const { api, state, navigate } = buildClient({ failRetryWith: 500 });

    await expect(api.get('/a')).rejects.toMatchObject({ response: { status: 500 } });

    expect(state.clearAuth).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ends the session without calling refresh when no refresh token is stored', async () => {
    const { api, server, navigate, cookies } = buildClient();
    cookies.refreshToken = '';

    await expect(api.get('/a')).rejects.toBeInstanceOf(AxiosError);

    expect(server.refreshCalls).toBe(0);
    expect(navigate).toHaveBeenCalledWith('/admin/login');
  });

  it('does not refresh again when the retried request is still unauthorized', async () => {
    const { api, server } = buildClient({ failRetryWith: 401 });

    await expect(api.get('/a')).rejects.toMatchObject({ response: { status: 401 } });

    expect(server.refreshCalls).toBe(1);
  });
});
