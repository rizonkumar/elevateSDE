import { AssessmentDifficulty, ProfileVisibility } from '@prisma/client';

export interface ProfileOrganization {
  name: string;
  allowPublicProfiles: boolean;
}

export interface PublicProfileSettingsRecord {
  handle: string | null;
  bio: string | null;
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  profileVisibility: ProfileVisibility;
  showOrganization: boolean;
  organization: ProfileOrganization | null;
}

export type PublicProfileSettingsWrite = Omit<PublicProfileSettingsRecord, 'organization'>;

export interface PublicProfileSettingsView extends PublicProfileSettingsRecord {
  isPublic: boolean;
}

export interface PublicProfileOwner extends PublicProfileSettingsRecord {
  userId: string;
  handle: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  isActive: boolean;
  joinedAt: Date;
}

export interface PublicProfileActivity {
  points: number;
  currentStreak: number;
  longestStreak: number;
}

export interface DifficultyCount {
  solved: number;
  total: number;
}

export interface SolvedBreakdown {
  solved: number;
  total: number;
  byDifficulty: Record<AssessmentDifficulty, DifficultyCount>;
}

export interface TopicSolvedCount {
  slug: string;
  name: string;
  solved: number;
}

export interface EarnedBadge {
  key: string;
  name: string;
  description: string;
  icon: string;
  awardedAt: Date;
}

export interface RecentSolve {
  slug: string;
  title: string;
  difficulty: AssessmentDifficulty;
  solvedAt: Date;
}

export interface HeatmapCell {
  date: string;
  count: number;
}

export interface PublicProfileRatingHistoryEntry {
  contestId: string;
  slug: string;
  title: string;
  endsAt: Date;
  rank: number;
  oldRating: number;
  newRating: number;
  delta: number;
}

export interface PublicProfileRating {
  rating: number;
  peakRating: number;
  contestsRated: number;
  history: PublicProfileRatingHistoryEntry[];
}

export interface PublicProfileView {
  handle: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  links: { github: string | null; linkedin: string | null; website: string | null };
  organizationName: string | null;
  joinedAt: Date;
  points: number;
  streak: { current: number; longest: number };
  solved: SolvedBreakdown;
  topTopics: TopicSolvedCount[];
  badges: EarnedBadge[];
  heatmap: HeatmapCell[];
  recentSolves: RecentSolve[];
  rating: PublicProfileRating | null;
}
