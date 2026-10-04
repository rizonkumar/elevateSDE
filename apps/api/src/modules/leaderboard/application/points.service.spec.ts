import { AssessmentDifficulty, PointSource } from '@prisma/client';
import { PointsService } from './points.service';
import { IPointLedgerRepository } from '../domain/interfaces/point-ledger-repository.interface';
import { PointAward } from '../domain/entities/point-award';

const USER_ID = 'user-1';

class FakePointLedgerRepository implements IPointLedgerRepository {
  awards: PointAward[] = [];
  difficulties = new Map<string, AssessmentDifficulty>();
  weeklyResets = 0;
  monthlyResets = 0;

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

  async resetWeeklyPoints(): Promise<number> {
    this.weeklyResets += 1;
    return 3;
  }

  async resetMonthlyPoints(): Promise<number> {
    this.monthlyResets += 1;
    return 4;
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

  describe('adjust', () => {
    it('records a non-periodic admin adjustment', async () => {
      await expect(service.adjust(USER_ID, -25)).resolves.toBe(true);

      const award = repository.awards[0];
      expect(award?.getSource()).toBe(PointSource.ADMIN_ADJUSTMENT);
      expect(award?.getDelta()).toBe(-25);
      expect(award?.affectsPeriodTotals()).toBe(false);
      expect(award?.countsAsAssessment()).toBe(false);
    });

    it('records each adjustment separately', async () => {
      await service.adjust(USER_ID, 5);
      await service.adjust(USER_ID, 5);

      expect(repository.totalFor(USER_ID)).toBe(10);
    });

    it('skips a zero adjustment', async () => {
      await expect(service.adjust(USER_ID, 0)).resolves.toBe(false);
      expect(repository.awards).toHaveLength(0);
    });
  });

  describe('period resets', () => {
    it('delegates weekly and monthly resets to the repository', async () => {
      await expect(service.resetWeekly()).resolves.toBe(3);
      await expect(service.resetMonthly()).resolves.toBe(4);
      expect(repository.weeklyResets).toBe(1);
      expect(repository.monthlyResets).toBe(1);
    });
  });
});
