import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateBadgeDto } from '@elevatesde/shared-types';
import { IAchievementRepository } from '../domain/interfaces/achievement-repository.interface';
import { Badge } from '../domain/entities/badge';
import { AchievementsView, AdminBadgeView } from '../domain/read-models/achievement-view';
import {
  BadgeAwardedEvent,
  NOTIFICATION_EVENTS,
} from '../../notification/domain/events/notification-events';

const GLOBAL_SCOPE: string | null = null;

@Injectable()
export class AchievementService {
  constructor(
    private readonly repository: IAchievementRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listForUser(userId: string): Promise<AchievementsView> {
    const [earned, activeBadges, metrics] = await Promise.all([
      this.repository.listEarned(userId),
      this.repository.listActiveBadges(GLOBAL_SCOPE),
      this.repository.getMetrics(userId),
    ]);
    const earnedIds = new Set(earned.map((entry) => entry.badge.getId()));
    const locked = activeBadges
      .filter((badge) => !earnedIds.has(badge.getId()))
      .map((badge) => ({
        badge,
        progress: Math.min(badge.progressFor(metrics), badge.getThreshold()),
      }));
    return { earned, locked };
  }

  async evaluate(userId: string): Promise<void> {
    const [metrics, earnedKeys, badges] = await Promise.all([
      this.repository.getMetrics(userId),
      this.repository.getUserBadgeKeys(userId),
      this.repository.listActiveBadges(GLOBAL_SCOPE),
    ]);
    const earned = new Set(earnedKeys);
    let awardedAny = false;
    for (const badge of badges) {
      if (earned.has(badge.getKey()) || !badge.qualifies(metrics)) {
        continue;
      }
      await this.repository.award(userId, badge.getId());
      earned.add(badge.getKey());
      awardedAny = true;
      this.eventEmitter.emit(NOTIFICATION_EVENTS.BADGE_AWARDED, {
        userId,
        badgeName: badge.getName(),
      } satisfies BadgeAwardedEvent);
    }
    if (awardedAny) {
      await this.repository.syncUserStatsBadges(userId, [...earned]);
    }
  }

  async listBadges(): Promise<AdminBadgeView[]> {
    return this.repository.listAllBadges();
  }

  async create(dto: CreateBadgeDto): Promise<AdminBadgeView> {
    return this.repository.createBadge(Badge.create(dto));
  }

  async update(id: string, dto: CreateBadgeDto): Promise<AdminBadgeView> {
    const existing = await this.requireBadge(id);
    return this.repository.updateBadge(existing.withDefinition(dto));
  }

  async delete(id: string): Promise<void> {
    await this.requireBadge(id);
    await this.repository.deleteBadge(id);
  }

  async grant(userId: string, badgeId: string): Promise<void> {
    await this.requireBadge(badgeId);
    await this.repository.award(userId, badgeId);
    await this.syncKeys(userId);
  }

  async revoke(userId: string, badgeId: string): Promise<void> {
    await this.repository.revoke(userId, badgeId);
    await this.syncKeys(userId);
  }

  private async requireBadge(id: string): Promise<Badge> {
    const badge = await this.repository.findById(id);
    if (!badge) {
      throw new NotFoundException('Badge not found');
    }
    return badge;
  }

  private async syncKeys(userId: string): Promise<void> {
    const keys = await this.repository.getUserBadgeKeys(userId);
    await this.repository.syncUserStatsBadges(userId, keys);
  }
}
