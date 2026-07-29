import { AssessmentDifficulty } from '@prisma/client';
import { ScoringService } from './scoring.service';
import { IScoringRepository } from '../domain/interfaces/scoring-repository.interface';
import { PointsAward } from '../domain/entities/points-award';
import { PointsBackfillResult } from '../domain/read-models/scoring-result';
import { AchievementService } from '../../achievement/application/achievement.service';

class FakeScoringRepository implements IScoringRepository {
  difficulty: AssessmentDifficulty | null = 'MEDIUM';
  insertSucceeds = true;
  failWith: Error | null = null;
  awarded: PointsAward[] = [];
  weeklyWindows: Date[] = [];
  monthlyWindows: Date[] = [];

  async findDifficulty(): Promise<AssessmentDifficulty | null> {
    return this.difficulty;
  }

  async awardFirstSolve(award: PointsAward): Promise<boolean> {
    if (this.failWith) {
      throw this.failWith;
    }
    this.awarded.push(award);
    return this.insertSucceeds;
  }

  async recomputeWeeklyBucket(weekStart: Date): Promise<number> {
    this.weeklyWindows.push(weekStart);
    return 0;
  }

  async recomputeMonthlyBucket(monthStart: Date): Promise<number> {
    this.monthlyWindows.push(monthStart);
    return 0;
  }

  async backfillFromHistory(
    _weekStart: Date,
    _monthStart: Date,
    dryRun: boolean,
  ): Promise<PointsBackfillResult> {
    return { usersTouched: 2, awardsInserted: 5, pointsAwarded: 120, dryRun };
  }

  async listUsersWithAwards(): Promise<string[]> {
    return ['u1', 'u2'];
  }
}

function buildService(repository: FakeScoringRepository): {
  service: ScoringService;
  evaluate: jest.Mock;
} {
  const evaluate = jest.fn().mockResolvedValue(undefined);
  const achievementService = { evaluate } as unknown as AchievementService;
  return { service: new ScoringService(repository, achievementService), evaluate };
}

describe('ScoringService', () => {
  it('awards difficulty-weighted points on a first solve', async () => {
    const repository = new FakeScoringRepository();
    const { service } = buildService(repository);

    const outcome = await service.awardForAcceptedSubmission('u1', 'p1');

    expect(outcome).toEqual({ firstSolve: true, pointsAwarded: 25 });
    expect(repository.awarded).toHaveLength(1);
    expect(repository.awarded[0]?.getPoints()).toBe(25);
    expect(repository.awarded[0]?.getSourceRef()).toBe('p1');
  });

  it('awards nothing when the problem was already solved', async () => {
    const repository = new FakeScoringRepository();
    repository.insertSucceeds = false;
    const { service } = buildService(repository);

    const outcome = await service.awardForAcceptedSubmission('u1', 'p1');

    expect(outcome).toEqual({ firstSolve: false, pointsAwarded: 0 });
  });

  it('awards nothing and does not throw when the problem is missing', async () => {
    const repository = new FakeScoringRepository();
    repository.difficulty = null;
    const { service } = buildService(repository);

    const outcome = await service.awardForAcceptedSubmission('u1', 'gone');

    expect(outcome).toEqual({ firstSolve: false, pointsAwarded: 0 });
    expect(repository.awarded).toHaveLength(0);
  });

  it('propagates repository failures so the queue retries', async () => {
    const repository = new FakeScoringRepository();
    repository.failWith = new Error('ledger unavailable');
    const { service } = buildService(repository);

    await expect(service.awardForAcceptedSubmission('u1', 'p1')).rejects.toThrow(
      'ledger unavailable',
    );
  });

  it('recomputes the weekly bucket from the preceding Monday', async () => {
    const repository = new FakeScoringRepository();
    const { service } = buildService(repository);

    await service.recomputeWeeklyBucket(new Date('2026-07-29T12:00:00.000Z'));

    expect(repository.weeklyWindows[0]?.toISOString()).toBe('2026-07-27T00:00:00.000Z');
  });

  it('recomputes the monthly bucket from the first of the month', async () => {
    const repository = new FakeScoringRepository();
    const { service } = buildService(repository);

    await service.recomputeMonthlyBucket(new Date('2026-07-29T12:00:00.000Z'));

    expect(repository.monthlyWindows[0]?.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('skips badge evaluation on a dry run', async () => {
    const repository = new FakeScoringRepository();
    const { service, evaluate } = buildService(repository);

    const result = await service.backfill({ dryRun: true, evaluateBadges: true });

    expect(result.dryRun).toBe(true);
    expect(evaluate).not.toHaveBeenCalled();
  });

  it('evaluates badges for every awarded user after a live backfill', async () => {
    const repository = new FakeScoringRepository();
    const { service, evaluate } = buildService(repository);

    await service.backfill({ dryRun: false, evaluateBadges: true });

    expect(evaluate).toHaveBeenCalledWith('u1');
    expect(evaluate).toHaveBeenCalledWith('u2');
  });
});
