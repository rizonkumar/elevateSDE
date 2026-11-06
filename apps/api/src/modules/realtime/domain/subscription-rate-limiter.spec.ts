import {
  SUBSCRIBE_LIMIT,
  SUBSCRIBE_WINDOW_MS,
  SubscriptionRateLimiter,
} from './subscription-rate-limiter';

describe('SubscriptionRateLimiter', () => {
  it('allows 20 attempts per 10 seconds and recovers once the window slides', () => {
    const limiter = new SubscriptionRateLimiter();
    const start = 1_000_000;

    for (let attempt = 0; attempt < SUBSCRIBE_LIMIT; attempt += 1) {
      expect(limiter.tryConsume(start + attempt)).toBe(true);
    }
    expect(limiter.tryConsume(start + 100)).toBe(false);
    expect(limiter.tryConsume(start + SUBSCRIBE_WINDOW_MS - 1)).toBe(false);
    expect(limiter.tryConsume(start + SUBSCRIBE_WINDOW_MS + 1)).toBe(true);
  });
});
