import { AssessmentDifficulty, PointSource } from '@prisma/client';
import { NON_PERIOD_SOURCES, PointAward } from './point-award';

describe('PointAward', () => {
  describe('problemSolved', () => {
    it('awards by difficulty, counts as an assessment and affects period totals', () => {
      const award = PointAward.problemSolved('u1', 'p1', AssessmentDifficulty.HARD);

      expect(award.getDelta()).toBe(40);
      expect(award.getRefId()).toBe('p1');
      expect(award.countsAsAssessment()).toBe(true);
      expect(award.affectsPeriodTotals()).toBe(true);
    });
  });

  describe('dailyChallenge', () => {
    it('awards the daily bonus without counting an assessment', () => {
      const award = PointAward.dailyChallenge('u1', 'challenge-1');

      expect(award.getSource()).toBe(PointSource.DAILY_CHALLENGE);
      expect(award.getDelta()).toBe(15);
      expect(award.countsAsAssessment()).toBe(false);
    });
  });

  describe('contestResult', () => {
    it.each([
      [1, 300, 80],
      [2, 300, 60],
      [3, 300, 50],
      [4, 300, 30],
      [1, 5, 51],
    ])('rank %i with score %i earns %i', (rank, score, expected) => {
      expect(PointAward.contestResult('c1', { userId: 'u1', rank, score })?.getDelta()).toBe(
        expected,
      );
    });

    it('awards nothing without a positive score', () => {
      expect(PointAward.contestResult('c1', { userId: 'u1', rank: 1, score: 0 })).toBeNull();
    });
  });

  describe('adminAdjustmentTo', () => {
    it('records the signed difference to the target', () => {
      expect(PointAward.adminAdjustmentTo('u1', 'a1', 120, 200)?.getDelta()).toBe(80);
      expect(PointAward.adminAdjustmentTo('u1', 'a1', 120, 20)?.getDelta()).toBe(-100);
    });

    it('returns null when the total already matches the target', () => {
      expect(PointAward.adminAdjustmentTo('u1', 'a1', 50, 50)).toBeNull();
    });

    it('clamps invalid targets to zero', () => {
      expect(PointAward.adminAdjustmentTo('u1', 'a1', 30, -10)?.getDelta()).toBe(-30);
      expect(PointAward.adminAdjustmentTo('u1', 'a1', 30, Number.NaN)?.getDelta()).toBe(-30);
    });

    it('is excluded from period totals and assessments', () => {
      const award = PointAward.adminAdjustmentTo('u1', 'a1', 0, 10);

      expect(NON_PERIOD_SOURCES).toContain(PointSource.ADMIN_ADJUSTMENT);
      expect(award?.affectsPeriodTotals()).toBe(false);
      expect(award?.countsAsAssessment()).toBe(false);
    });
  });
});
