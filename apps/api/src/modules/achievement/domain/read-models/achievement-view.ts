import { Badge } from '../entities/badge';

export interface UserMetrics {
  problemsSolved: number;
  streakDays: number;
  assessmentsCompleted: number;
  forumPosts: number;
  points: number;
}

export interface EarnedBadgeView {
  badge: Badge;
  awardedAt: Date;
}

export interface LockedBadgeView {
  badge: Badge;
  progress: number;
}

export interface AchievementsView {
  earned: EarnedBadgeView[];
  locked: LockedBadgeView[];
}

export interface AdminBadgeView {
  badge: Badge;
  awardCount: number;
}
