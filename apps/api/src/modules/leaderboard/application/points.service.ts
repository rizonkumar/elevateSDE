import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPointLedgerRepository } from '../domain/interfaces/point-ledger-repository.interface';
import { ContestPlacement, PointAward } from '../domain/entities/point-award';
import { PointPeriod, periodStart } from '../domain/point-periods';
import { POINTS_EVENTS, PointsAwardedEvent } from '../domain/events/points-events';

@Injectable()
export class PointsService {
  constructor(
    private readonly repository: IPointLedgerRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async awardProblemSolved(userId: string, problemId: string): Promise<boolean> {
    const difficulty = await this.repository.findProblemDifficulty(problemId);
    if (!difficulty) {
      return false;
    }
    return this.awardAndAnnounce(PointAward.problemSolved(userId, problemId, difficulty));
  }

  async awardDailyChallenge(userId: string, dailyChallengeId: string): Promise<boolean> {
    return this.awardAndAnnounce(PointAward.dailyChallenge(userId, dailyChallengeId));
  }

  async awardContestResults(contestId: string, placements: ContestPlacement[]): Promise<number> {
    const awards = placements.flatMap((placement) => {
      const award = PointAward.contestResult(contestId, placement);
      return award ? [award] : [];
    });
    const results = await Promise.all(awards.map((award) => this.awardAndAnnounce(award)));
    return results.filter(Boolean).length;
  }

  async adjustTo(userId: string, targetPoints: number): Promise<boolean> {
    return this.repository.adjustTo(userId, targetPoints, randomUUID());
  }

  async refreshPeriodTotals(period: PointPeriod, now: Date = new Date()): Promise<number> {
    return this.repository.recalculatePeriodTotals(period, periodStart(period, now));
  }

  private async awardAndAnnounce(award: PointAward): Promise<boolean> {
    const awarded = await this.repository.award(award);
    if (awarded) {
      const event: PointsAwardedEvent = {
        userId: award.getUserId(),
        source: award.getSource(),
        refId: award.getRefId(),
        delta: award.getDelta(),
        awardedAt: new Date(),
      };
      this.eventEmitter.emit(POINTS_EVENTS.AWARDED, event);
    }
    return awarded;
  }
}
