export const REFRESH_TOKEN_TTL_DAYS = 7;
export const REFRESH_REUSE_GRACE_MS = 30_000;

export function isWithinReuseGrace(rotatedAt: Date, now: Date): boolean {
  return now.getTime() - rotatedAt.getTime() <= REFRESH_REUSE_GRACE_MS;
}

export function refreshTokenExpiry(issuedAt: Date): Date {
  const expiresAt = new Date(issuedAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}
