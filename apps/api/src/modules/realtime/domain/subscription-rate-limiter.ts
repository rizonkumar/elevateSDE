export const SUBSCRIBE_LIMIT = 20;
export const SUBSCRIBE_WINDOW_MS = 10_000;

export class SubscriptionRateLimiter {
  private readonly attempts: number[] = [];

  constructor(
    private readonly limit: number = SUBSCRIBE_LIMIT,
    private readonly windowMs: number = SUBSCRIBE_WINDOW_MS,
  ) {}

  tryConsume(now: number): boolean {
    const windowStart = now - this.windowMs;
    while (this.attempts.length > 0 && (this.attempts[0] ?? now) <= windowStart) {
      this.attempts.shift();
    }
    if (this.attempts.length >= this.limit) {
      return false;
    }
    this.attempts.push(now);
    return true;
  }
}
