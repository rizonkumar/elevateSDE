import { createSessionStore } from '@elevatesde/api-client';

export const useAuthStore = createSessionStore({
  secureCookies: process.env.NODE_ENV === 'production',
});
