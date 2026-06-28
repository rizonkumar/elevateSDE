import { NotFoundException } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { IAchievementRepository } from '../domain/interfaces/achievement-repository.interface';
import { Badge } from '../domain/entities/badge';
import { AdminBadgeView, EarnedBadgeView, UserMetrics } from '../domain/read-models/achievement-view';

const USER_ID = 'user-1';

const ZERO_METRICS: UserMetrics = {
  problemsSolved: 0,
  streakDays: 0,
  assessmentsCompleted: 0,
  forumPosts: 0,
  points: 0,
};

function buildBadge(key: string, threshold: number, isActive = true): Badge {
  return Badge.reconstitute({
    id: `badge-${key}`,
    key,
    name: key,
    description: key,
    icon: 'Award',
    criteriaType: 'PROBLEMS_SOLVED',
    threshold,
    tenantId: null,
    isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

class FakeAchievementRepository implements IAchievementRepository {
  badges: Badge[] = [];
  earned: EarnedBadgeView[] = [];
  metrics: UserMetrics = { ...ZERO_METRICS };
  awarded: Array<{ userId: string; badgeId: string }> = [];
  revoked: Array<{ userId: string; badgeId: string }> = [];
  syncedKeys: string[] | null = null;

  async listActiveBadges(): Promise<Badge[]> {
    return this.badges.filter((badge) => badge.isActiveBadge());
  }

  async listAllBadges(): Promise<AdminBadgeView[]> {
    return this.badges.map((badge) => ({ badge, awardCount: 0 }));
  }

  async listEarned(): Promise<EarnedBadgeView[]> {
    return this.earned;
  }

  async getMetrics(): Promise<UserMetrics> {
    return this.metrics;
  }

  async getUserBadgeKeys(): Promise<string[]> {
    return this.earned.map((entry) => entry.badge.getKey());
  }

  async award(userId: string, badgeId: string): Promise<void> {
    this.awarded.push({ userId, badgeId });
    const badge = this.badges.find((entry) => entry.getId() === badgeId);
    if (badge && !this.earned.some((entry) => entry.badge.getId() === badgeId)) {
      this.earned.push({ badge, awardedAt: new Date() });
    }
  }

  async revoke(userId: string, badgeId: string): Promise<void> {
    this.revoked.push({ userId, badgeId });
    this.earned = this.earned.filter((entry) => entry.badge.getId() !== badgeId);
  }

  async syncUserStatsBadges(_userId: string, keys: string[]): Promise<void> {
    this.syncedKeys = keys;
  }

  async findById(id: string): Promise<Badge | null> {
    return this.badges.find((badge) => badge.getId() === id) ?? null;
  }

  async createBadge(badge: Badge): Promise<AdminBadgeView> {
    this.badges.push(badge);
    return { badge, awardCount: 0 };
  }

  async updateBadge(badge: Badge): Promise<AdminBadgeView> {
    return { badge, awardCount: 0 };
  }

  async deleteBadge(id: string): Promise<void> {
    this.badges = this.badges.filter((badge) => badge.getId() !== id);
  }
}

describe('AchievementService', () => {
  let repository: FakeAchievementRepository;
  let service: AchievementService;

  beforeEach(() => {
    repository = new FakeAchievementRepository();
    service = new AchievementService(repository);
  });

  describe('evaluate', () => {
    it('awards a badge exactly once when a metric crosses the threshold', async () => {
      repository.badges = [buildBadge('first-blood', 1)];
      repository.metrics = { ...ZERO_METRICS, problemsSolved: 1 };

      await service.evaluate(USER_ID);
      await service.evaluate(USER_ID);

      expect(repository.awarded).toEqual([{ userId: USER_ID, badgeId: 'badge-first-blood' }]);
      expect(repository.syncedKeys).toEqual(['first-blood']);
    });

    it('does not award when the metric is below the threshold', async () => {
      repository.badges = [buildBadge('getting-started', 10)];
      repository.metrics = { ...ZERO_METRICS, problemsSolved: 3 };

      await service.evaluate(USER_ID);

      expect(repository.awarded).toHaveLength(0);
      expect(repository.syncedKeys).toBeNull();
    });

    it('never auto-awards inactive badges', async () => {
      repository.badges = [buildBadge('hidden', 1, false)];
      repository.metrics = { ...ZERO_METRICS, problemsSolved: 5 };

      await service.evaluate(USER_ID);

      expect(repository.awarded).toHaveLength(0);
    });
  });

  describe('listForUser', () => {
    it('returns earned badges and locked badges with clamped progress', async () => {
      const earnedBadge = buildBadge('first-blood', 1);
      const lockedBadge = buildBadge('getting-started', 10);
      repository.badges = [earnedBadge, lockedBadge];
      repository.earned = [{ badge: earnedBadge, awardedAt: new Date() }];
      repository.metrics = { ...ZERO_METRICS, problemsSolved: 15 };

      const view = await service.listForUser(USER_ID);

      expect(view.earned.map((entry) => entry.badge.getKey())).toEqual(['first-blood']);
      expect(view.locked).toHaveLength(1);
      expect(view.locked[0]?.badge.getKey()).toBe('getting-started');
      expect(view.locked[0]?.progress).toBe(10);
    });
  });

  describe('grant and revoke', () => {
    it('grants a badge and syncs the full key set', async () => {
      const badge = buildBadge('manual', 999);
      repository.badges = [badge];

      await service.grant(USER_ID, badge.getId());

      expect(repository.awarded).toEqual([{ userId: USER_ID, badgeId: 'badge-manual' }]);
      expect(repository.syncedKeys).toEqual(['manual']);
    });

    it('throws when granting an unknown badge', async () => {
      await expect(service.grant(USER_ID, 'missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('revokes a badge and syncs the remaining keys', async () => {
      const badge = buildBadge('manual', 999);
      repository.badges = [badge];
      repository.earned = [{ badge, awardedAt: new Date() }];

      await service.revoke(USER_ID, badge.getId());

      expect(repository.revoked).toEqual([{ userId: USER_ID, badgeId: 'badge-manual' }]);
      expect(repository.syncedKeys).toEqual([]);
    });
  });
});
