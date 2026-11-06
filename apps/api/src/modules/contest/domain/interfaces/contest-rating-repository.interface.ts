import { RatingChange } from '../rating/rating-calculator';
import {
  PendingRatingContest,
  RateContestCommand,
  RatingCandidate,
  RatingHistoryEntryView,
  RatingLeaderboardPage,
  RatingLeaderboardScope,
  StandingRatingView,
  UserRatingView,
} from '../read-models/contest-rating-view';

export abstract class IContestRatingRepository {
  abstract findPendingContests(): Promise<PendingRatingContest[]>;
  abstract findEarliestUnfinalizedRatedEndsAt(now: Date): Promise<Date | null>;
  abstract findRatingCandidates(contest: PendingRatingContest): Promise<RatingCandidate[]>;
  abstract rateContest(command: RateContestCommand): Promise<RatingChange[] | null>;
  abstract markRatedWithoutChanges(contestId: string, ratedAt: Date): Promise<boolean>;
  abstract findUserRating(userId: string): Promise<UserRatingView | null>;
  abstract listHistory(userId: string, limit: number): Promise<RatingHistoryEntryView[]>;
  abstract listLeaderboard(
    scope: RatingLeaderboardScope,
    offset: number,
    limit: number,
  ): Promise<RatingLeaderboardPage>;
  abstract findStandingRatings(contestId: string): Promise<Map<string, StandingRatingView>>;
}
