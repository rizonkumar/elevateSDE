import { AssessmentDifficulty, BadgeCriteriaType } from '@prisma/client';

export interface PublicProfileStatsView {
  points: number;
  rank: number | null;
  streakDays: number;
  longestStreak: number;
  problemsSolved: number;
  acceptanceRate: number;
  byDifficulty: Record<AssessmentDifficulty, number>;
}

export interface PublicBadgeView {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: BadgeCriteriaType;
  threshold: number;
  isActive: boolean;
  awardedAt: Date;
}

export interface PublicHeatmapCellView {
  date: string;
  count: number;
}

export interface PublicListSummaryView {
  id: string;
  name: string;
  itemCount: number;
  createdAt: Date;
}

export interface PublicProfileView {
  handle: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  joinedAt: Date;
  stats: PublicProfileStatsView;
  badges: PublicBadgeView[];
  heatmap: PublicHeatmapCellView[];
  publicLists: PublicListSummaryView[];
}
