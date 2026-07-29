import { DIFFICULTY_POINTS, pointsForDifficulty } from './points-policy';

describe('points policy', () => {
  it('awards more for harder problems', () => {
    expect(pointsForDifficulty('EASY')).toBe(10);
    expect(pointsForDifficulty('MEDIUM')).toBe(25);
    expect(pointsForDifficulty('HARD')).toBe(50);
  });

  it('only defines positive integer awards', () => {
    for (const points of Object.values(DIFFICULTY_POINTS)) {
      expect(Number.isInteger(points)).toBe(true);
      expect(points).toBeGreaterThan(0);
    }
  });
});
