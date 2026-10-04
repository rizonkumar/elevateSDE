import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { IPointLedgerRepository } from '../domain/interfaces/point-ledger-repository.interface';
import { ContestPlacement, PointAward } from '../domain/entities/point-award';

@Injectable()
export class PointsService {
  constructor(private readonly repository: IPointLedgerRepository) {}

  async awardProblemSolved(userId: string, problemId: string): Promise<boolean> {
    const difficulty = await this.repository.findProblemDifficulty(problemId);
    if (!difficulty) {
      return false;
    }
    return this.repository.award(PointAward.problemSolved(userId, problemId, difficulty));
  }

  async awardDailyChallenge(userId: string, dailyChallengeId: string): Promise<boolean> {
    return this.repository.award(PointAward.dailyChallenge(userId, dailyChallengeId));
  }

  async awardContestResults(contestId: string, placements: ContestPlacement[]): Promise<number> {
    const awards = placements.flatMap((placement) => {
      const award = PointAward.contestResult(contestId, placement);
      return award ? [award] : [];
    });
    let awardedCount = 0;
    for (const award of awards) {
      if (await this.repository.award(award)) {
        awardedCount += 1;
      }
    }
    return awardedCount;
  }

  async adjust(userId: string, delta: number): Promise<boolean> {
    const award = PointAward.adminAdjustment(userId, randomUUID(), delta);
    return award ? this.repository.award(award) : false;
  }

  async resetWeekly(): Promise<number> {
    return this.repository.resetWeeklyPoints();
  }

  async resetMonthly(): Promise<number> {
    return this.repository.resetMonthlyPoints();
  }
}
