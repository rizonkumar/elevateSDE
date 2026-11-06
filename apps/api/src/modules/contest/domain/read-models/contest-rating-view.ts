import { RatingChange, RatingEntry } from '../rating/rating-calculator';

export interface PendingRatingContest {
  id: string;
  slug: string;
  title: string;
  isRated: boolean;
  startsAt: Date;
  endsAt: Date;
  problemIds: string[];
}

export interface RatingCandidate {
  userId: string;
  rank: number;
}

export interface RateContestCommand {
  contestId: string;
  ratedAt: Date;
  candidates: RatingCandidate[];
  calculate: (entries: RatingEntry[]) => RatingChange[];
}

export interface UserRatingView {
  rating: number;
  peakRating: number;
  contestsRated: number;
}

export interface RatingHistoryEntryView {
  contestId: string;
  slug: string;
  title: string;
  endsAt: Date;
  rank: number;
  oldRating: number;
  newRating: number;
  delta: number;
}

export interface UserRatingSummaryView extends UserRatingView {
  history: RatingHistoryEntryView[];
}

export type RatingLeaderboardScope = { kind: 'platform' } | { kind: 'tenant'; tenantId: string | null };

export interface RatingLeaderboardRowView {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  publicHandle: string | null;
  rating: number;
  peakRating: number;
  contestsRated: number;
}

export interface RatingLeaderboardPage {
  rows: RatingLeaderboardRowView[];
  total: number;
}

export interface StandingRatingView {
  delta: number;
  newRating: number;
}
