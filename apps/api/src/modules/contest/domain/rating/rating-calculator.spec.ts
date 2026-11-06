import { computeRatingChanges, RatingEntry, winProbability } from './rating-calculator';

function deltasByUser(entries: RatingEntry[]): Record<string, number> {
  return Object.fromEntries(
    computeRatingChanges(entries).map((change) => [change.userId, change.delta]),
  );
}

describe('computeRatingChanges', () => {
  it('returns no changes for fewer than two participants', () => {
    expect(computeRatingChanges([])).toEqual([]);
    expect(computeRatingChanges([{ userId: 'a', rank: 1, rating: 1500 }])).toEqual([]);
  });

  it('moves two equal players symmetrically', () => {
    expect(
      computeRatingChanges([
        { userId: 'b', rank: 2, rating: 1500 },
        { userId: 'a', rank: 1, rating: 1500 },
      ]),
    ).toEqual([
      { userId: 'a', rank: 1, oldRating: 1500, newRating: 1597, delta: 97, performance: 1715 },
      { userId: 'b', rank: 2, oldRating: 1500, newRating: 1403, delta: -97, performance: 1325 },
    ]);
  });

  it('leaves everyone unchanged when all participants tie at the same rating', () => {
    const changes = computeRatingChanges([
      { userId: 'a', rank: 1, rating: 1500 },
      { userId: 'b', rank: 1, rating: 1500 },
      { userId: 'c', rank: 1, rating: 1500 },
    ]);

    expect(changes.map((change) => change.delta)).toEqual([0, 0, 0]);
    expect(changes.map((change) => change.performance)).toEqual([1500, 1500, 1500]);
  });

  it('gives tied participants the same change', () => {
    const deltas = deltasByUser([
      { userId: 'a', rank: 1, rating: 1600 },
      { userId: 'b', rank: 2, rating: 1500 },
      { userId: 'c', rank: 2, rating: 1500 },
      { userId: 'd', rank: 4, rating: 1400 },
    ]);

    expect(deltas.b).toBe(deltas.c);
  });

  it('rewards an upset heavily', () => {
    expect(
      deltasByUser([
        { userId: 'low', rank: 1, rating: 1300 },
        { userId: 'high', rank: 2, rating: 1900 },
      ]),
    ).toEqual({ low: 306, high: -306 });
  });

  it('lifts a newcomer who outperforms veterans', () => {
    expect(
      deltasByUser([
        { userId: 'v1', rank: 1, rating: 2000 },
        { userId: 'new', rank: 2, rating: 1500 },
        { userId: 'v2', rank: 3, rating: 1800 },
        { userId: 'v3', rank: 4, rating: 1700 },
      ]),
    ).toEqual({ v1: 62, new: 127, v2: -70, v3: -119 });
  });

  it('never inflates the rating pool', () => {
    const entries: RatingEntry[] = Array.from({ length: 40 }, (_, index) => ({
      userId: `user-${index}`,
      rank: index + 1,
      rating: 1200 + ((index * 137) % 900),
    }));

    const total = computeRatingChanges(entries).reduce((sum, change) => sum + change.delta, 0);

    expect(total).toBeLessThanOrEqual(entries.length / 2);
  });

  it('does not shift deltas upward when the pool would deflate', () => {
    const changes = computeRatingChanges([
      { userId: 'a', rank: 1, rating: 3950 },
      { userId: 'b', rank: 2, rating: 3900 },
      { userId: 'c', rank: 3, rating: 3800 },
    ]);
    const rawTotal = changes.reduce(
      (sum, change) => sum + (change.performance - change.oldRating) / 2,
      0,
    );
    const total = changes.reduce((sum, change) => sum + change.delta, 0);

    expect(rawTotal).toBeLessThan(0);
    expect(Math.abs(total - rawTotal)).toBeLessThanOrEqual(changes.length);
  });

  it('never drops a rating below zero', () => {
    const changes = computeRatingChanges([
      { userId: 'top', rank: 1, rating: 0 },
      { userId: 'floor', rank: 2, rating: 10 },
    ]);

    expect(changes.every((change) => change.newRating >= 0)).toBe(true);
  });

  it('is deterministic regardless of input order', () => {
    const entries: RatingEntry[] = [
      { userId: 'c', rank: 3, rating: 1610 },
      { userId: 'a', rank: 1, rating: 1420 },
      { userId: 'b', rank: 2, rating: 1790 },
    ];

    expect(computeRatingChanges(entries)).toEqual(computeRatingChanges([...entries].reverse()));
  });
});

describe('winProbability', () => {
  it('is even for equal ratings and favours the higher rating', () => {
    expect(winProbability(1500, 1500)).toBeCloseTo(0.5);
    expect(winProbability(1900, 1500)).toBeCloseTo(10 / 11);
  });
});
