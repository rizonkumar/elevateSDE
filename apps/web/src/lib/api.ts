import { createApiClient } from '@elevatesde/api-client';
import { useAuthStore } from '../store/auth.store';

export const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4400',
  session: useAuthStore,
  loginPath: '/login',
});
