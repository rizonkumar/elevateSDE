import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ContestRatingUpdatedEvent,
  NOTIFICATION_EVENTS,
} from '../../notification/domain/events/notification-events';
import { IContestRatingRepository } from '../domain/interfaces/contest-rating-repository.interface';
import {
  computeRatingChanges,
  INITIAL_RATING,
  RatingChange,
} from '../domain/rating/rating-calculator';
import {
  PendingRatingContest,
  RatingLeaderboardPage,
  RatingLeaderboardScope,
  StandingRatingView,
  UserRatingSummaryView,
} from '../domain/read-models/contest-rating-view';

const MIN_RATED_PARTICIPANTS = 2;
const HISTORY_LIMIT = 50;

@Injectable()
export class ContestRatingService {
  private readonly logger = new Logger(ContestRatingService.name);

  constructor(
    private readonly repository: IContestRatingRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async ratePending(now: Date = new Date()): Promise<number> {
    const [contests, blockedFrom] = await Promise.all([
      this.repository.findPendingContests(),
      this.repository.findEarliestUnfinalizedRatedEndsAt(now),
    ]);
    let ratedCount = 0;
    for (const contest of contests) {
      if (blockedFrom && contest.endsAt.getTime() >= blockedFrom.getTime()) {
        break;
      }
      if (await this.rate(contest, now)) {
        ratedCount += 1;
      }
    }
    return ratedCount;
  }

  async getSummary(userId: string): Promise<UserRatingSummaryView> {
    const [rating, history] = await Promise.all([
      this.repository.findUserRating(userId),
      this.repository.listHistory(userId, HISTORY_LIMIT),
    ]);
    return {
      rating: rating?.rating ?? INITIAL_RATING,
      peakRating: rating?.peakRating ?? INITIAL_RATING,
      contestsRated: rating?.contestsRated ?? 0,
      history,
    };
  }

  async findRatedSummary(userId: string): Promise<UserRatingSummaryView | null> {
    const summary = await this.getSummary(userId);
    return summary.contestsRated > 0 ? summary : null;
  }

  async getLeaderboard(
    scope: RatingLeaderboardScope,
    page: number,
    pageSize: number,
  ): Promise<RatingLeaderboardPage> {
    if (scope.kind === 'tenant' && scope.tenantId === null) {
      return { rows: [], total: 0 };
    }
    return this.repository.listLeaderboard(scope, (page - 1) * pageSize, pageSize);
  }

  async getStandingRatings(contestId: string): Promise<Map<string, StandingRatingView>> {
    return this.repository.findStandingRatings(contestId);
  }

  private async rate(contest: PendingRatingContest, ratedAt: Date): Promise<boolean> {
    if (!contest.isRated) {
      return this.repository.markRatedWithoutChanges(contest.id, ratedAt);
    }
    const candidates = await this.repository.findRatingCandidates(contest);
    if (candidates.length < MIN_RATED_PARTICIPANTS) {
      return this.repository.markRatedWithoutChanges(contest.id, ratedAt);
    }
    const changes = await this.repository.rateContest({
      contestId: contest.id,
      ratedAt,
      candidates,
      calculate: computeRatingChanges,
    });
    if (!changes) {
      return false;
    }
    this.logger.log(`Rated contest ${contest.id}: ${changes.length} rating changes`);
    this.announce(contest, changes);
    return true;
  }

  private announce(contest: PendingRatingContest, changes: RatingChange[]): void {
    for (const change of changes) {
      const event: ContestRatingUpdatedEvent = {
        userId: change.userId,
        contestId: contest.id,
        contestSlug: contest.slug,
        contestTitle: contest.title,
        oldRating: change.oldRating,
        newRating: change.newRating,
        delta: change.delta,
      };
      this.eventEmitter.emit(NOTIFICATION_EVENTS.CONTEST_RATING_UPDATED, event);
    }
  }
}
