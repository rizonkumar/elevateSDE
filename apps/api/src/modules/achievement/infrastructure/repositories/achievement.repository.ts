import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IAchievementRepository } from '../../domain/interfaces/achievement-repository.interface';
import { Badge } from '../../domain/entities/badge';
import { AdminBadgeView, EarnedBadgeView, UserMetrics } from '../../domain/read-models/achievement-view';
import { BadgeMapper } from '../mappers/badge.mapper';

@Injectable()
export class AchievementRepository implements IAchievementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveBadges(tenantId: string | null): Promise<Badge[]> {
    const records = await this.prisma.badge.findMany({
      where: { isActive: true, tenantId },
      orderBy: [{ criteriaType: 'asc' }, { threshold: 'asc' }],
    });
    return records.map((record) => BadgeMapper.toDomain(record));
  }

  async listAllBadges(): Promise<AdminBadgeView[]> {
    const records = await this.prisma.badge.findMany({
      orderBy: [{ criteriaType: 'asc' }, { threshold: 'asc' }],
      include: { _count: { select: { userBadges: true } } },
    });
    return records.map((record) => ({
      badge: BadgeMapper.toDomain(record),
      awardCount: record._count.userBadges,
    }));
  }

  async listEarned(userId: string): Promise<EarnedBadgeView[]> {
    const records = await this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
      include: { badge: true },
    });
    return records.map((record) => ({
      badge: BadgeMapper.toDomain(record.badge),
      awardedAt: record.awardedAt,
    }));
  }

  async getMetrics(userId: string): Promise<UserMetrics> {
    const [solved, forumPosts, stats] = await Promise.all([
      this.prisma.submission.groupBy({
        by: ['problemId'],
        where: { userId, status: SubmissionStatus.ACCEPTED },
      }),
      this.prisma.forumPost.count({ where: { userId } }),
      this.prisma.userStats.findUnique({ where: { userId } }),
    ]);
    return {
      problemsSolved: solved.length,
      streakDays: Math.max(stats?.streakDays ?? 0, stats?.longestStreak ?? 0),
      assessmentsCompleted: stats?.assessmentsCompleted ?? 0,
      forumPosts,
      points: stats?.points ?? 0,
    };
  }

  async getUserBadgeKeys(userId: string): Promise<string[]> {
    const records = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badge: { select: { key: true } } },
    });
    return records.map((record) => record.badge.key);
  }

  async award(userId: string, badgeId: string): Promise<void> {
    await this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId } },
      update: {},
      create: { id: randomUUID(), userId, badgeId },
    });
  }

  async revoke(userId: string, badgeId: string): Promise<void> {
    await this.prisma.userBadge.deleteMany({ where: { userId, badgeId } });
  }

  async syncUserStatsBadges(userId: string, keys: string[]): Promise<void> {
    await this.prisma.userStats.upsert({
      where: { userId },
      update: { badges: keys },
      create: { userId, badges: keys },
    });
  }

  async findById(id: string): Promise<Badge | null> {
    const record = await this.prisma.badge.findUnique({ where: { id } });
    return record ? BadgeMapper.toDomain(record) : null;
  }

  async createBadge(badge: Badge): Promise<AdminBadgeView> {
    const record = await this.prisma.badge.create({
      data: BadgeMapper.toPersistence(badge),
      include: { _count: { select: { userBadges: true } } },
    });
    return { badge: BadgeMapper.toDomain(record), awardCount: record._count.userBadges };
  }

  async updateBadge(badge: Badge): Promise<AdminBadgeView> {
    const record = await this.prisma.badge.update({
      where: { id: badge.getId() },
      data: BadgeMapper.toPersistence(badge),
      include: { _count: { select: { userBadges: true } } },
    });
    return { badge: BadgeMapper.toDomain(record), awardCount: record._count.userBadges };
  }

  async deleteBadge(id: string): Promise<void> {
    await this.prisma.badge.delete({ where: { id } });
  }
}
