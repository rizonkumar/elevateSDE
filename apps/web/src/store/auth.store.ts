import Cookies from 'js-cookie';
import { create } from 'zustand';
import { UserDto } from '@elevatesde/shared-types';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDto, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
}

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { user: null, accessToken: null, isAuthenticated: false };
  }
  const accessToken = Cookies.get('accessToken') || null;
  const userJson = Cookies.get('user');
  let user: UserDto | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      Cookies.remove('user');
    }
  }
  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  setAuth: (user, accessToken, refreshToken) => {
    Cookies.set('accessToken', accessToken, { expires: 7, secure: true, sameSite: 'strict' });
    if (refreshToken) {
      Cookies.set('refreshToken', refreshToken, { expires: 7, secure: true, sameSite: 'strict' });
    }
    Cookies.set('user', JSON.stringify(user), { expires: 7, secure: true, sameSite: 'strict' });
    set({ user, accessToken, isAuthenticated: true });
  },
  clearAuth: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
