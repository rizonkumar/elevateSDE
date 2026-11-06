import { IContestRatingRepository } from '../domain/interfaces/contest-rating-repository.interface';
import { INITIAL_RATING, RatingChange } from '../domain/rating/rating-calculator';
import {
  PendingRatingContest,
  RateContestCommand,
  RatingCandidate,
  RatingHistoryEntryView,
  RatingLeaderboardPage,
  RatingLeaderboardScope,
  StandingRatingView,
  UserRatingView,
} from '../domain/read-models/contest-rating-view';

interface StoredContest extends PendingRatingContest {
  ratedAt: Date | null;
}

export const buildPendingContest = (
  overrides: Partial<PendingRatingContest> = {},
): PendingRatingContest => ({
  id: 'contest-1',
  slug: 'weekly-1',
  title: 'Weekly 1',
  isRated: true,
  startsAt: new Date('2026-10-01T18:00:00.000Z'),
  endsAt: new Date('2026-10-01T19:30:00.000Z'),
  problemIds: ['p1', 'p2'],
  ...overrides,
});

export class FakeContestRatingRepository implements IContestRatingRepository {
  contests: StoredContest[] = [];
  candidates = new Map<string, RatingCandidate[]>();
  ratings = new Map<string, UserRatingView>();
  changes = new Map<string, RatingChange[]>();
  ratedOrder: string[] = [];
  unfinalizedRatedEndsAt: Date | null = null;
  leaderboardScopes: RatingLeaderboardScope[] = [];

  addContest(contest: PendingRatingContest, candidates: RatingCandidate[] = []): void {
    this.contests.push({ ...contest, ratedAt: null });
    this.candidates.set(contest.id, candidates);
  }

  ratedAtOf(contestId: string): Date | null {
    return this.contests.find((contest) => contest.id === contestId)?.ratedAt ?? null;
  }

  async findPendingContests(): Promise<PendingRatingContest[]> {
    return this.contests
      .filter((contest) => contest.ratedAt === null)
      .sort((left, right) => left.endsAt.getTime() - right.endsAt.getTime())
      .map(({ ratedAt: _ratedAt, ...contest }) => contest);
  }

  async findEarliestUnfinalizedRatedEndsAt(): Promise<Date | null> {
    return this.unfinalizedRatedEndsAt;
  }

  async findRatingCandidates(contest: PendingRatingContest): Promise<RatingCandidate[]> {
    return this.candidates.get(contest.id) ?? [];
  }

  async rateContest(command: RateContestCommand): Promise<RatingChange[] | null> {
    if (!this.claim(command.contestId, command.ratedAt)) {
      return null;
    }
    const changes = command.calculate(
      command.candidates.map((candidate) => ({
        userId: candidate.userId,
        rank: candidate.rank,
        rating: this.ratings.get(candidate.userId)?.rating ?? INITIAL_RATING,
      })),
    );
    for (const change of changes) {
      const previous = this.ratings.get(change.userId);
      this.ratings.set(change.userId, {
        rating: change.newRating,
        peakRating: Math.max(previous?.peakRating ?? INITIAL_RATING, change.newRating),
        contestsRated: (previous?.contestsRated ?? 0) + 1,
      });
    }
    this.changes.set(command.contestId, changes);
    this.ratedOrder.push(command.contestId);
    return changes;
  }

  async markRatedWithoutChanges(contestId: string, ratedAt: Date): Promise<boolean> {
    return this.claim(contestId, ratedAt);
  }

  async findUserRating(userId: string): Promise<UserRatingView | null> {
    return this.ratings.get(userId) ?? null;
  }

  async listHistory(): Promise<RatingHistoryEntryView[]> {
    return [];
  }

  async listLeaderboard(scope: RatingLeaderboardScope): Promise<RatingLeaderboardPage> {
    this.leaderboardScopes.push(scope);
    return { rows: [], total: 0 };
  }

  async findStandingRatings(contestId: string): Promise<Map<string, StandingRatingView>> {
    return new Map(
      (this.changes.get(contestId) ?? []).map((change) => [
        change.userId,
        { delta: change.delta, newRating: change.newRating },
      ]),
    );
  }

  private claim(contestId: string, ratedAt: Date): boolean {
    const contest = this.contests.find((entry) => entry.id === contestId);
    if (contest?.ratedAt !== null) {
      return false;
    }
    contest.ratedAt = ratedAt;
    return true;
  }
}
