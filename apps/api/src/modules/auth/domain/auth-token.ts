export const AUTH_TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

export type AuthTokenType = (typeof AUTH_TOKEN_TYPES)[keyof typeof AUTH_TOKEN_TYPES];

export interface AuthTokenPayload {
  sub: string;
  email: string;
  typ: AuthTokenType;
}

export function isAccessTokenPayload(
  payload: Partial<AuthTokenPayload>,
): payload is AuthTokenPayload {
  return (
    payload.typ === AUTH_TOKEN_TYPES.ACCESS &&
    typeof payload.sub === 'string' &&
    typeof payload.email === 'string'
  );
}
