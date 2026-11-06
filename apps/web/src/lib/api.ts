import { createApiClient } from '@elevatesde/api-client';
import { useAuthStore } from '../store/auth.store';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4400';

export const { api, signOut, accessToken, renewSession } = createApiClient({
  baseURL: API_BASE_URL,
  session: useAuthStore,
  loginPath: '/login',
});
