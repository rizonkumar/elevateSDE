import { Injectable } from '@nestjs/common';
import { startOfUtcMonth, startOfUtcWeek } from '../../../common/utc-period';
import { AchievementService } from '../../achievement/application/achievement.service';
import { IScoringRepository } from '../domain/interfaces/scoring-repository.interface';
import { PointsAward } from '../domain/entities/points-award';
import { pointsForDifficulty } from '../domain/points-policy';
import { AwardOutcome, PointsBackfillResult } from '../domain/read-models/scoring-result';

const NO_AWARD: AwardOutcome = { firstSolve: false, pointsAwarded: 0 };

export interface BackfillOptions {
  dryRun: boolean;
  evaluateBadges: boolean;
}

@Injectable()
export class ScoringService {
  constructor(
    private readonly repository: IScoringRepository,
    private readonly achievementService: AchievementService,
  ) {}

  async awardForAcceptedSubmission(userId: string, problemId: string): Promise<AwardOutcome> {
    const difficulty = await this.repository.findDifficulty(problemId);
    if (!difficulty) {
      return NO_AWARD;
    }
    const points = pointsForDifficulty(difficulty);
    const award = PointsAward.forFirstSolve({ userId, problemId, points });
    const inserted = await this.repository.awardFirstSolve(award);
    return inserted ? { firstSolve: true, pointsAwarded: points } : NO_AWARD;
  }

  async recomputeWeeklyBucket(now: Date): Promise<number> {
    return this.repository.recomputeWeeklyBucket(startOfUtcWeek(now));
  }

  async recomputeMonthlyBucket(now: Date): Promise<number> {
    return this.repository.recomputeMonthlyBucket(startOfUtcMonth(now));
  }

  async backfill(options: BackfillOptions): Promise<PointsBackfillResult> {
    const now = new Date();
    const result = await this.repository.backfillFromHistory(
      startOfUtcWeek(now),
      startOfUtcMonth(now),
      options.dryRun,
    );
    if (options.evaluateBadges && !options.dryRun) {
      const userIds = await this.repository.listUsersWithAwards();
      for (const userId of userIds) {
        await this.achievementService.evaluate(userId);
      }
    }
    return result;
  }
}
