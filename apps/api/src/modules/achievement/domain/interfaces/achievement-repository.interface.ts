import { Badge } from '../entities/badge';
import { AdminBadgeView, EarnedBadgeView, UserMetrics } from '../read-models/achievement-view';

export abstract class IAchievementRepository {
  abstract listActiveBadges(tenantId: string | null): Promise<Badge[]>;
  abstract listAllBadges(): Promise<AdminBadgeView[]>;
  abstract listEarned(userId: string): Promise<EarnedBadgeView[]>;
  abstract getMetrics(userId: string): Promise<UserMetrics>;
  abstract getUserBadgeKeys(userId: string): Promise<string[]>;
  abstract award(userId: string, badgeId: string): Promise<void>;
  abstract revoke(userId: string, badgeId: string): Promise<void>;
  abstract syncUserStatsBadges(userId: string, keys: string[]): Promise<void>;
  abstract findById(id: string): Promise<Badge | null>;
  abstract createBadge(badge: Badge): Promise<AdminBadgeView>;
  abstract updateBadge(badge: Badge): Promise<AdminBadgeView>;
  abstract deleteBadge(id: string): Promise<void>;
}
