import Cookies from 'js-cookie';
import { create, StoreApi, UseBoundStore } from 'zustand';
import { UserDto } from '@elevatesde/shared-types';

export const SESSION_COOKIES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

const SESSION_COOKIE_DAYS = 7;

export interface SessionState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDto, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
}

export type SessionStore = UseBoundStore<StoreApi<SessionState>>;

export interface SessionStoreOptions {
  secureCookies: boolean;
}

type SessionSnapshot = Pick<SessionState, 'user' | 'accessToken' | 'isAuthenticated'>;

const SIGNED_OUT: SessionSnapshot = { user: null, accessToken: null, isAuthenticated: false };

function readUser(): UserDto | null {
  const userJson = Cookies.get(SESSION_COOKIES.USER);
  if (!userJson) {
    return null;
  }
  try {
    return JSON.parse(userJson) as UserDto;
  } catch {
    Cookies.remove(SESSION_COOKIES.USER);
    return null;
  }
}

function readSnapshot(): SessionSnapshot {
  if (globalThis.window === undefined) {
    return SIGNED_OUT;
  }
  const accessToken = Cookies.get(SESSION_COOKIES.ACCESS_TOKEN) ?? null;
  return { user: readUser(), accessToken, isAuthenticated: accessToken !== null };
}

export function createSessionStore({ secureCookies }: SessionStoreOptions): SessionStore {
  const cookieOptions = {
    expires: SESSION_COOKIE_DAYS,
    secure: secureCookies,
    sameSite: 'lax' as const,
  };
  return create<SessionState>((set) => ({
    ...readSnapshot(),
    setAuth: (user, accessToken, refreshToken) => {
      Cookies.set(SESSION_COOKIES.ACCESS_TOKEN, accessToken, cookieOptions);
      if (refreshToken) {
        Cookies.set(SESSION_COOKIES.REFRESH_TOKEN, refreshToken, cookieOptions);
      }
      Cookies.set(SESSION_COOKIES.USER, JSON.stringify(user), cookieOptions);
      set({ user, accessToken, isAuthenticated: true });
    },
    clearAuth: () => {
      Object.values(SESSION_COOKIES).forEach((name) => Cookies.remove(name));
      set(SIGNED_OUT);
    },
  }));
}
