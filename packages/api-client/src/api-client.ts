import axios, {
  AxiosError,
  AxiosInstance,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';
import { AuthResponseDto } from '@elevatesde/shared-types';
import { createRefreshCoordinator } from './refresh-coordinator';
import { SESSION_COOKIES, SessionState } from './session-store';

const REFRESH_PATH = '/api/v1/auth/refresh';
const UNAUTHORIZED = 401;

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

const cookieTokens: SessionTokens = {
  accessToken: () => Cookies.get(SESSION_COOKIES.ACCESS_TOKEN),
  refreshToken: () => Cookies.get(SESSION_COOKIES.REFRESH_TOKEN),
};

function redirectTo(path: string): void {
  if (globalThis.window !== undefined) {
    globalThis.window.location.href = path;
  }
}

export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const tokens = options.tokens ?? cookieTokens;
  const navigate = options.navigate ?? redirectTo;
  const defaults: CreateAxiosDefaults = { baseURL: options.baseURL, adapter: options.adapter };
  const api = axios.create(defaults);
  const refreshClient = axios.create(defaults);

  const refreshSession = createRefreshCoordinator(async (refreshToken) => {
    const { data } = await refreshClient.post<AuthResponseDto>(REFRESH_PATH, { refreshToken });
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
      endSession();
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
      if (!request || error.response?.status !== UNAUTHORIZED || request._retry) {
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

  return api;
}
