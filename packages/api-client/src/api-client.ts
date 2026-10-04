import axios, {
  AxiosError,
  AxiosInstance,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import Cookies from 'js-cookie';
import { AuthResponseDto } from '@elevatesde/shared-types';
import { createRefreshCoordinator } from './refresh-coordinator';
import { SESSION_COOKIES, SessionState } from './session-store';

const AUTH_PATH_PREFIX = '/api/v1/auth/';
const REFRESH_PATH = `${AUTH_PATH_PREFIX}refresh`;
const LOGOUT_PATH = `${AUTH_PATH_PREFIX}logout`;
const UNAUTHORIZED = 401;
const SESSION_REJECTED_STATUSES: readonly number[] = [400, UNAUTHORIZED, 403];

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export interface SessionTokens {
  accessToken(): string | undefined;
  refreshToken(): string | undefined;
}

export interface SessionStoreHandle {
  getState(): Pick<SessionState, 'setAuth' | 'clearAuth'>;
}

export interface ApiClientOptions {
  baseURL: string;
  session: SessionStoreHandle;
  loginPath: string;
  tokens?: SessionTokens;
  navigate?: (path: string) => void;
  adapter?: CreateAxiosDefaults['adapter'];
}

export interface ApiClient {
  api: AxiosInstance;
  signOut(): Promise<boolean>;
}

const cookieTokens: SessionTokens = {
  accessToken: () => Cookies.get(SESSION_COOKIES.ACCESS_TOKEN),
  refreshToken: () => Cookies.get(SESSION_COOKIES.REFRESH_TOKEN),
};

function redirectTo(path: string): void {
  if (globalThis.window !== undefined) {
    globalThis.window.location.href = path;
  }
}

function isAuthEndpoint(request: InternalAxiosRequestConfig): boolean {
  return request.url?.startsWith(AUTH_PATH_PREFIX) ?? false;
}

function isSessionRejected(error: unknown): boolean {
  return isAxiosError(error) && SESSION_REJECTED_STATUSES.includes(error.response?.status ?? 0);
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const tokens = options.tokens ?? cookieTokens;
  const navigate = options.navigate ?? redirectTo;
  const defaults: CreateAxiosDefaults = { baseURL: options.baseURL, adapter: options.adapter };
  const api = axios.create(defaults);
  const authClient = axios.create(defaults);

  const refreshSession = createRefreshCoordinator(async (refreshToken) => {
    const { data } = await authClient.post<AuthResponseDto>(REFRESH_PATH, { refreshToken });
    options.session.getState().setAuth(data.user, data.accessToken, data.refreshToken);
    return data;
  });

  const endSession = (): void => {
    options.session.getState().clearAuth();
    navigate(options.loginPath);
  };

  const renewAccessToken = async (refreshToken: string): Promise<string> => {
    try {
      const session = await refreshSession(refreshToken);
      return session.accessToken;
    } catch (refreshError) {
      if (isSessionRejected(refreshError)) {
        endSession();
      }
      throw refreshError;
    }
  };

  api.interceptors.request.use((config) => {
    const accessToken = tokens.accessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const request = error.config as RetriableRequestConfig | undefined;
      if (
        !request ||
        error.response?.status !== UNAUTHORIZED ||
        request._retry ||
        isAuthEndpoint(request)
      ) {
        throw error;
      }
      request._retry = true;
      const refreshToken = tokens.refreshToken();
      if (!refreshToken) {
        endSession();
        throw error;
      }
      request.headers.Authorization = `Bearer ${await renewAccessToken(refreshToken)}`;
      return api(request);
    },
  );

  const revokeRemoteSession = async (): Promise<boolean> => {
    const refreshToken = tokens.refreshToken();
    if (!refreshToken) {
      return false;
    }
    return authClient.post(LOGOUT_PATH, { refreshToken }).then(
      () => true,
      () => false,
    );
  };

  const signOut = async (): Promise<boolean> => {
    const revoked = await revokeRemoteSession();
    options.session.getState().clearAuth();
    return revoked;
  };

  return { api, signOut };
}
