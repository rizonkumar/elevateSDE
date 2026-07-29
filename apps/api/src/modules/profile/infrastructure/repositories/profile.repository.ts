import { Injectable } from '@nestjs/common';
import { AssessmentDifficulty, Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IProfileRepository } from '../../domain/interfaces/profile-repository.interface';
import {
  PublicBadgeView,
  PublicHeatmapCellView,
  PublicListSummaryView,
  PublicProfileStatsView,
  PublicProfileView,
} from '../../domain/read-models/public-profile-view';

const DIFFICULTIES: AssessmentDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const HEATMAP_WINDOW_DAYS = 365;

@Injectable()
export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicProfile(handle: string): Promise<PublicProfileView | null> {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      select: {
        id: true,
        handle: true,
        firstName: true,
        lastName: true,
        headline: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        createdAt: true,
        isProfilePublic: true,
      },
    });
    if (!user || !user.isProfilePublic) {
      return null;
    }

    const [stats, badges, heatmap, publicLists] = await Promise.all([
      this.getStats(user.id),
      this.getBadges(user.id),
      this.getHeatmap(user.id),
      this.getPublicLists(user.id),
    ]);

    return {
      handle: user.handle,
      firstName: user.firstName,
      lastName: user.lastName,
      headline: user.headline,
      bio: user.bio,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      websiteUrl: user.websiteUrl,
      joinedAt: user.createdAt,
      stats,
      badges,
      heatmap,
      publicLists,
    };
  }

  private async getStats(userId: string): Promise<PublicProfileStatsView> {
    const [statsRow, solved, totalSubmissions, acceptedSubmissions] = await Promise.all([
      this.prisma.userStats.findUnique({ where: { userId } }),
      this.prisma.submission.groupBy({
        by: ['problemId'],
        where: { userId, status: SubmissionStatus.ACCEPTED },
      }),
      this.prisma.submission.count({ where: { userId } }),
      this.prisma.submission.count({ where: { userId, status: SubmissionStatus.ACCEPTED } }),
    ]);

    const solvedProblemIds = solved.map((row) => row.problemId);
    const byDifficulty = DIFFICULTIES.reduce(
      (acc, difficulty) => {
        acc[difficulty] = 0;
        return acc;
      },
      {} as Record<AssessmentDifficulty, number>,
    );
    if (solvedProblemIds.length > 0) {
      const grouped = await this.prisma.problem.groupBy({
        by: ['difficulty'],
        where: { id: { in: solvedProblemIds } },
        _count: { _all: true },
      });
      for (const row of grouped) {
        byDifficulty[row.difficulty] = row._count._all;
      }
    }

    const rank = statsRow
      ? (await this.prisma.userStats.count({ where: { points: { gt: statsRow.points } } })) + 1
      : null;

    return {
      points: statsRow?.points ?? 0,
      rank,
      streakDays: statsRow?.streakDays ?? 0,
      longestStreak: statsRow?.longestStreak ?? 0,
      problemsSolved: solvedProblemIds.length,
      acceptanceRate:
        totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
      byDifficulty,
    };
  }

  private async getBadges(userId: string): Promise<PublicBadgeView[]> {
    const records = await this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
      include: { badge: true },
    });
    return records.map((record) => ({
      id: record.badge.id,
      key: record.badge.key,
      name: record.badge.name,
      description: record.badge.description,
      icon: record.badge.icon,
      criteriaType: record.badge.criteriaType,
      threshold: record.badge.threshold,
      isActive: record.badge.isActive,
      awardedAt: record.awardedAt,
    }));
  }

  private async getHeatmap(userId: string): Promise<PublicHeatmapCellView[]> {
    const to = new Date();
    const from = new Date(to.getTime() - HEATMAP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.$queryRaw<Array<{ date: string; count: number }>>(Prisma.sql`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date, count(*)::int AS count
      FROM "Submission"
      WHERE "userId" = ${userId} AND "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((row) => ({ date: row.date, count: Number(row.count) }));
  }

  private async getPublicLists(userId: string): Promise<PublicListSummaryView[]> {
    const rows = await this.prisma.problemList.findMany({
      where: { userId, isPublic: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      itemCount: row._count.items,
      createdAt: row.createdAt,
    }));
  }
}
