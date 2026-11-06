import { millisecondsUntilExpiry } from './token-expiry';

describe('millisecondsUntilExpiry', () => {
  it('returns the remaining lifetime, never negative and within the timer limit', () => {
    expect(millisecondsUntilExpiry(10_000, 4_000)).toBe(6_000);
    expect(millisecondsUntilExpiry(1_000, 4_000)).toBe(0);
    expect(millisecondsUntilExpiry(Number.MAX_SAFE_INTEGER, 0)).toBe(2_147_483_647);
  });
});
