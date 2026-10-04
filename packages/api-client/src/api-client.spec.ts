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

type RefreshFailure = 401 | 503 | 'network' | null;

interface FakeServer {
  validAccessToken: string;
  refreshCalls: number;
  refreshFailure: RefreshFailure;
  failRetryWith: number | null;
  logoutBodies: unknown[];
  logoutFails: boolean;
}

interface Echo {
  url: string;
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

function refreshResponse(
  config: InternalAxiosRequestConfig,
  server: FakeServer,
): Promise<AxiosResponse> {
  if (server.refreshFailure === 'network') {
    return Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));
  }
  if (server.refreshFailure !== null) {
    return respond(config, server.refreshFailure, null);
  }
  const session: AuthResponseDto = {
    accessToken: server.validAccessToken,
    refreshToken: `refresh-${server.refreshCalls + 1}`,
    user: USER,
  };
  return respond(config, 200, session);
}

function buildClient(overrides: Partial<FakeServer> = {}) {
  const server: FakeServer = {
    validAccessToken: 'access-2',
    refreshCalls: 0,
    refreshFailure: null,
    failRetryWith: null,
    logoutBodies: [],
    logoutFails: false,
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
      return refreshResponse(config, server);
    }
    if (config.url === '/api/v1/auth/logout') {
      server.logoutBodies.push(JSON.parse(String(config.data)));
      return server.logoutFails ? respond(config, 503, null) : respond(config, 200, null);
    }
    if (config.url === '/api/v1/auth/login') {
      return respond(config, 401, null);
    }
    const authorization = String(config.headers.Authorization ?? '');
    seenAuthorization.push(authorization);
    if (authorization !== `Bearer ${server.validAccessToken}`) {
      return respond(config, 401, null);
    }
    if (server.failRetryWith !== null) {
      return respond(config, server.failRetryWith, null);
    }
    return respond(config, 200, { url: config.url });
  };

  const client = createApiClient({
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

  return { ...client, server, state, navigate, cookies, seenAuthorization };
}

describe('createApiClient', () => {
  it('sends the current access token', async () => {
    const { api, seenAuthorization } = buildClient({ validAccessToken: 'access-1' });

    await api.get('/users/me');

    expect(seenAuthorization).toEqual(['Bearer access-1']);
  });

  it('refreshes once for parallel 401s and retries every request with the new token', async () => {
    const { api, server, state } = buildClient();

    const responses = await Promise.all([
      api.get<Echo>('/a'),
      api.get<Echo>('/b'),
      api.get<Echo>('/c'),
    ]);

    expect(server.refreshCalls).toBe(1);
    expect(responses.map((response) => response.data.url)).toEqual(['/a', '/b', '/c']);
    expect(state.setAuth).toHaveBeenCalledWith(USER, 'access-2', 'refresh-2');
    expect(state.clearAuth).not.toHaveBeenCalled();
  });

  it('ends the session and redirects to the configured login when the refresh is rejected', async () => {
    const { api, state, navigate } = buildClient({ refreshFailure: 401 });

    await expect(api.get('/a')).rejects.toBeInstanceOf(AxiosError);

    expect(state.clearAuth).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/admin/login');
  });

  it.each<[string, RefreshFailure]>([
    ['a network error', 'network'],
    ['a server outage', 503],
  ])('keeps the session when the refresh fails with %s', async (_label, refreshFailure) => {
    const { api, state, navigate } = buildClient({ refreshFailure });

    await expect(api.get('/a')).rejects.toBeInstanceOf(AxiosError);

    expect(state.clearAuth).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
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

  it('passes auth endpoint failures such as a wrong password straight to the caller', async () => {
    const { api, server, state, navigate } = buildClient();

    await expect(api.post('/api/v1/auth/login', {})).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(server.refreshCalls).toBe(0);
    expect(state.clearAuth).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  describe('signOut', () => {
    it('revokes the refresh token on the server and clears the session', async () => {
      const { signOut, server, state } = buildClient();

      await expect(signOut()).resolves.toBe(true);

      expect(server.logoutBodies).toEqual([{ refreshToken: 'refresh-1' }]);
      expect(state.clearAuth).toHaveBeenCalledTimes(1);
    });

    it('still clears the local session when the server logout fails', async () => {
      const { signOut, state } = buildClient({ logoutFails: true });

      await expect(signOut()).resolves.toBe(false);

      expect(state.clearAuth).toHaveBeenCalledTimes(1);
    });

    it('clears the local session without calling the server when no refresh token exists', async () => {
      const { signOut, server, state, cookies } = buildClient();
      cookies.refreshToken = '';

      await expect(signOut()).resolves.toBe(false);

      expect(server.logoutBodies).toEqual([]);
      expect(state.clearAuth).toHaveBeenCalledTimes(1);
    });
  });
});
