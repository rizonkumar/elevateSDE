import {
  EarnedBadge,
  PublicProfileActivity,
  PublicProfileOwner,
  PublicProfileSettingsRecord,
  PublicProfileSettingsWrite,
  RecentSolve,
  SolvedBreakdown,
  TopicSolvedCount,
} from '../read-models/public-profile';

export abstract class IPublicProfileRepository {
  abstract findOwnerByHandle(handle: string): Promise<PublicProfileOwner | null>;
  abstract getActivity(userId: string): Promise<PublicProfileActivity>;
  abstract getSolvedBreakdown(userId: string): Promise<SolvedBreakdown>;
  abstract listTopTopics(userId: string, limit: number): Promise<TopicSolvedCount[]>;
  abstract listBadges(userId: string): Promise<EarnedBadge[]>;
  abstract listRecentSolves(userId: string, limit: number): Promise<RecentSolve[]>;
  abstract findSettings(userId: string): Promise<PublicProfileSettingsRecord | null>;
  abstract findUserIdByHandle(handle: string): Promise<string | null>;
  abstract saveSettings(userId: string, settings: PublicProfileSettingsWrite): Promise<void>;
}
