import { AssessmentDifficulty, PointSource } from '@prisma/client';
import { PointsService } from './points.service';
import { IPointLedgerRepository } from '../domain/interfaces/point-ledger-repository.interface';
import { PointAward } from '../domain/entities/point-award';
import { PointPeriod } from '../domain/point-periods';

const USER_ID = 'user-1';

class FakePointLedgerRepository implements IPointLedgerRepository {
  awards: PointAward[] = [];
  difficulties = new Map<string, AssessmentDifficulty>();
  storedPoints = new Map<string, number>();
  recalculations: Array<{ period: PointPeriod; since: Date }> = [];

  async award(award: PointAward): Promise<boolean> {
    const duplicate = this.awards.some(
      (existing) =>
        existing.getUserId() === award.getUserId() &&
        existing.getSource() === award.getSource() &&
        existing.getRefId() === award.getRefId(),
    );
    if (duplicate) {
      return false;
    }
    this.awards.push(award);
    return true;
  }

  async findProblemDifficulty(problemId: string): Promise<AssessmentDifficulty | null> {
    return this.difficulties.get(problemId) ?? null;
  }

  async adjustTo(userId: string, targetPoints: number, adjustmentId: string): Promise<boolean> {
    const current = this.storedPoints.get(userId);
    if (current === undefined) {
      return false;
    }
    const award = PointAward.adminAdjustmentTo(userId, adjustmentId, current, targetPoints);
    if (!award) {
      return false;
    }
    this.storedPoints.set(userId, current + award.getDelta());
    return this.award(award);
  }

  async recalculatePeriodTotals(period: PointPeriod, since: Date): Promise<number> {
    this.recalculations.push({ period, since });
    return 3;
  }

  totalFor(userId: string): number {
    return this.awards
      .filter((award) => award.getUserId() === userId)
      .reduce((sum, award) => sum + award.getDelta(), 0);
  }
}

describe('PointsService', () => {
  let repository: FakePointLedgerRepository;
  let service: PointsService;

  beforeEach(() => {
    repository = new FakePointLedgerRepository();
    service = new PointsService(repository);
  });

  describe('awardProblemSolved', () => {
    it.each([
      [AssessmentDifficulty.EASY, 10],
      [AssessmentDifficulty.MEDIUM, 20],
      [AssessmentDifficulty.HARD, 40],
    ])('awards %s problems %i points', async (difficulty, expected) => {
      repository.difficulties.set('p1', difficulty);

      await expect(service.awardProblemSolved(USER_ID, 'p1')).resolves.toBe(true);

      expect(repository.totalFor(USER_ID)).toBe(expected);
    });

    it('awards only the first accept of a problem', async () => {
      repository.difficulties.set('p1', AssessmentDifficulty.EASY);

      await service.awardProblemSolved(USER_ID, 'p1');
      await expect(service.awardProblemSolved(USER_ID, 'p1')).resolves.toBe(false);

      expect(repository.totalFor(USER_ID)).toBe(10);
    });

    it('counts a solved problem as a completed assessment', async () => {
      repository.difficulties.set('p1', AssessmentDifficulty.EASY);

      await service.awardProblemSolved(USER_ID, 'p1');

      expect(repository.awards[0]?.countsAsAssessment()).toBe(true);
      expect(repository.awards[0]?.affectsPeriodTotals()).toBe(true);
    });

    it('awards nothing for an unknown problem', async () => {
      await expect(service.awardProblemSolved(USER_ID, 'missing')).resolves.toBe(false);
      expect(repository.awards).toHaveLength(0);
    });
  });

  describe('awardDailyChallenge', () => {
    it('awards the daily bonus once per challenge', async () => {
      await service.awardDailyChallenge(USER_ID, 'challenge-1');
      await service.awardDailyChallenge(USER_ID, 'challenge-1');

      expect(repository.awards).toHaveLength(1);
      expect(repository.awards[0]?.getSource()).toBe(PointSource.DAILY_CHALLENGE);
      expect(repository.totalFor(USER_ID)).toBe(15);
    });
  });

  describe('awardContestResults', () => {
    it('awards scaled score plus podium bonus and skips scoreless placements', async () => {
      const awarded = await service.awardContestResults('contest-1', [
        { userId: 'u1', rank: 1, score: 300 },
        { userId: 'u2', rank: 2, score: 100 },
        { userId: 'u3', rank: 3, score: 0 },
        { userId: 'u4', rank: 4, score: 200 },
      ]);

      expect(awarded).toBe(3);
      expect(repository.totalFor('u1')).toBe(30 + 50);
      expect(repository.totalFor('u2')).toBe(10 + 30);
      expect(repository.totalFor('u3')).toBe(0);
      expect(repository.totalFor('u4')).toBe(20);
    });

    it('is idempotent across repeated finalization', async () => {
      const placements = [{ userId: 'u1', rank: 1, score: 100 }];

      await service.awardContestResults('contest-1', placements);
      const second = await service.awardContestResults('contest-1', placements);

      expect(second).toBe(0);
      expect(repository.totalFor('u1')).toBe(60);
    });
  });

  describe('adjustTo', () => {
    it('records the difference to the target as a non-periodic adjustment', async () => {
      repository.storedPoints.set(USER_ID, 125);

      await expect(service.adjustTo(USER_ID, 100)).resolves.toBe(true);

      const award = repository.awards[0];
      expect(award?.getSource()).toBe(PointSource.ADMIN_ADJUSTMENT);
      expect(award?.getDelta()).toBe(-25);
      expect(award?.affectsPeriodTotals()).toBe(false);
      expect(award?.countsAsAssessment()).toBe(false);
    });

    it('records each adjustment with its own reference', async () => {
      repository.storedPoints.set(USER_ID, 0);

      await service.adjustTo(USER_ID, 5);
      await service.adjustTo(USER_ID, 10);

      expect(repository.awards.map((award) => award.getDelta())).toEqual([5, 5]);
      expect(new Set(repository.awards.map((award) => award.getRefId())).size).toBe(2);
    });

    it('skips an adjustment that matches the current total', async () => {
      repository.storedPoints.set(USER_ID, 40);

      await expect(service.adjustTo(USER_ID, 40)).resolves.toBe(false);
      expect(repository.awards).toHaveLength(0);
    });

    it('clamps negative targets to zero', async () => {
      repository.storedPoints.set(USER_ID, 30);

      await service.adjustTo(USER_ID, -10);

      expect(repository.awards[0]?.getDelta()).toBe(-30);
    });
  });

  describe('refreshPeriodTotals', () => {
    it('recalculates weekly totals from the start of the current UTC week', async () => {
      const now = new Date('2026-10-07T09:30:00.000Z');

      await expect(service.refreshPeriodTotals('weekly', now)).resolves.toBe(3);

      expect(repository.recalculations).toEqual([
        { period: 'weekly', since: new Date('2026-10-05T00:00:00.000Z') },
      ]);
    });

    it('recalculates monthly totals from the first of the current UTC month', async () => {
      await service.refreshPeriodTotals('monthly', new Date('2026-10-07T09:30:00.000Z'));

      expect(repository.recalculations[0]?.since).toEqual(new Date('2026-10-01T00:00:00.000Z'));
    });
  });
});
