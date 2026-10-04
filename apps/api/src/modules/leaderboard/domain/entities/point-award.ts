import { AssessmentDifficulty, PointSource } from '@prisma/client';
import { POINT_RULES } from '@elevatesde/shared-types';
import { clampNonNegative } from '../../../../shared/domain/clamp-non-negative';

export const NON_PERIOD_SOURCES: readonly PointSource[] = [PointSource.ADMIN_ADJUSTMENT];

export interface ContestPlacement {
  userId: string;
  rank: number;
  score: number;
}

export class PointAward {
  private constructor(
    private readonly userId: string,
    private readonly source: PointSource,
    private readonly refId: string,
    private readonly delta: number,
  ) {}

  static problemSolved(
    userId: string,
    problemId: string,
    difficulty: AssessmentDifficulty,
  ): PointAward {
    return new PointAward(
      userId,
      PointSource.PROBLEM_SOLVED,
      problemId,
      POINT_RULES.problemSolved[difficulty],
    );
  }

  static dailyChallenge(userId: string, dailyChallengeId: string): PointAward {
    return new PointAward(
      userId,
      PointSource.DAILY_CHALLENGE,
      dailyChallengeId,
      POINT_RULES.dailyChallenge,
    );
  }

  static contestResult(contestId: string, placement: ContestPlacement): PointAward | null {
    const delta = contestResultPoints(placement.rank, placement.score);
    return delta > 0
      ? new PointAward(placement.userId, PointSource.CONTEST_RESULT, contestId, delta)
      : null;
  }

  static adminAdjustmentTo(
    userId: string,
    adjustmentId: string,
    currentPoints: number,
    targetPoints: number,
  ): PointAward | null {
    const delta = clampNonNegative(targetPoints) - currentPoints;
    return delta === 0
      ? null
      : new PointAward(userId, PointSource.ADMIN_ADJUSTMENT, adjustmentId, delta);
  }

  countsAsAssessment(): boolean {
    return this.source === PointSource.PROBLEM_SOLVED;
  }

  affectsPeriodTotals(): boolean {
    return !NON_PERIOD_SOURCES.includes(this.source);
  }

  getUserId(): string {
    return this.userId;
  }

  getSource(): PointSource {
    return this.source;
  }

  getRefId(): string {
    return this.refId;
  }

  getDelta(): number {
    return this.delta;
  }
}

function contestResultPoints(rank: number, score: number): number {
  if (score <= 0) {
    return 0;
  }
  const podiumBonus = POINT_RULES.contestPodiumBonus[rank - 1] ?? 0;
  return Math.round(score / POINT_RULES.contestScoreDivisor) + podiumBonus;
}
