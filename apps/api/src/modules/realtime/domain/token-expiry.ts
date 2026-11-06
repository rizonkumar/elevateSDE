const MAX_TIMER_DELAY_MS = 2_147_483_647;

export function millisecondsUntilExpiry(expiresAt: number, now: number): number {
  return Math.min(Math.max(expiresAt - now, 0), MAX_TIMER_DELAY_MS);
}
