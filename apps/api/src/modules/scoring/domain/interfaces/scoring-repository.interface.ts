import { AssessmentDifficulty } from '@prisma/client';
import { PointsAward } from '../entities/points-award';
import { PointsBackfillResult } from '../read-models/scoring-result';

export abstract class IScoringRepository {
  abstract findDifficulty(problemId: string): Promise<AssessmentDifficulty | null>;
  abstract awardFirstSolve(award: PointsAward): Promise<boolean>;
  abstract recomputeWeeklyBucket(weekStart: Date): Promise<number>;
  abstract recomputeMonthlyBucket(monthStart: Date): Promise<number>;
  abstract backfillFromHistory(
    weekStart: Date,
    monthStart: Date,
    dryRun: boolean,
  ): Promise<PointsBackfillResult>;
  abstract listUsersWithAwards(): Promise<string[]>;
}
