import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '../store/auth.store';
import { AuthResponseDto } from '@elevatesde/shared-types';

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4400',
});

let refreshInFlight: Promise<AuthResponseDto> | null = null;

function refreshSession(refreshToken: string): Promise<AuthResponseDto> {
  refreshInFlight ??= axios
    .post<AuthResponseDto>(`${api.defaults.baseURL}/api/v1/auth/refresh`, { refreshToken })
    .then((response) => {
      const { user, accessToken, refreshToken: nextRefreshToken } = response.data;
      useAuthStore.getState().setAuth(user, accessToken, nextRefreshToken);
      return response.data;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function endSession(): void {
  useAuthStore.getState().clearAuth();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      endSession();
      return Promise.reject(error);
    }
    try {
      const { accessToken } = await refreshSession(refreshToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      endSession();
      return Promise.reject(refreshError);
    }
  },
);
