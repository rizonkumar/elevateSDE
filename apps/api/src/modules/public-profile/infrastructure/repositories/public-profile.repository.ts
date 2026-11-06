import { Injectable } from '@nestjs/common';
import { AccountStatus, AssessmentDifficulty, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { isUniqueConstraintViolation } from '../../../../infrastructure/prisma/prisma-errors';
import { HandleTakenError } from '../../domain/errors/handle-taken.error';
import { IPublicProfileRepository } from '../../domain/interfaces/public-profile-repository.interface';
import {
  DifficultyCount,
  EarnedBadge,
  PublicProfileActivity,
  PublicProfileOwner,
  PublicProfileSettingsRecord,
  PublicProfileSettingsWrite,
  RecentSolve,
  SolvedBreakdown,
  TopicSolvedCount,
} from '../../domain/read-models/public-profile';

const DIFFICULTIES: AssessmentDifficulty[] = [
  AssessmentDifficulty.EASY,
  AssessmentDifficulty.MEDIUM,
  AssessmentDifficulty.HARD,
];

const SETTINGS_SELECT = {
  handle: true,
  bio: true,
  location: true,
  githubUrl: true,
  linkedinUrl: true,
  websiteUrl: true,
  profileVisibility: true,
  showOrganization: true,
  tenant: { select: { name: true, allowPublicProfiles: true } },
} as const;

type SettingsRow = Prisma.UserGetPayload<{ select: typeof SETTINGS_SELECT }>;

interface DifficultyRow {
  difficulty: string;
  total: number;
  solved: number;
}

interface TopicRow {
  slug: string;
  name: string;
  solved: number;
}

interface RecentSolveRow {
  slug: string;
  title: string;
  difficulty: string;
  solvedAt: Date;
}

function isDifficulty(value: string): value is AssessmentDifficulty {
  return (DIFFICULTIES as string[]).includes(value);
}

function toSettings(row: SettingsRow): PublicProfileSettingsRecord {
  return {
    handle: row.handle,
    bio: row.bio,
    location: row.location,
    githubUrl: row.githubUrl,
    linkedinUrl: row.linkedinUrl,
    websiteUrl: row.websiteUrl,
    profileVisibility: row.profileVisibility,
    showOrganization: row.showOrganization,
    organization: row.tenant
      ? { name: row.tenant.name, allowPublicProfiles: row.tenant.allowPublicProfiles }
      : null,
  };
}

@Injectable()
export class PublicProfileRepository implements IPublicProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOwnerByHandle(handle: string): Promise<PublicProfileOwner | null> {
    const row = await this.prisma.user.findUnique({
      where: { handle },
      select: {
        ...SETTINGS_SELECT,
        id: true,
        firstName: true,
        lastName: true,
        headline: true,
        status: true,
        createdAt: true,
      },
    });
    if (!row || row.handle === null) {
      return null;
    }
    return {
      ...toSettings(row),
      userId: row.id,
      handle: row.handle,
      firstName: row.firstName,
      lastName: row.lastName,
      headline: row.headline,
      isActive: row.status === AccountStatus.ACTIVE,
      joinedAt: row.createdAt,
    };
  }

  async getActivity(userId: string): Promise<PublicProfileActivity> {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
      select: { points: true, streakDays: true, longestStreak: true },
    });
    return {
      points: stats?.points ?? 0,
      currentStreak: stats?.streakDays ?? 0,
      longestStreak: Math.max(stats?.longestStreak ?? 0, stats?.streakDays ?? 0),
    };
  }

  async getSolvedBreakdown(userId: string): Promise<SolvedBreakdown> {
    const rows = await this.prisma.$queryRaw<DifficultyRow[]>(Prisma.sql`
      SELECT p."difficulty"::text AS difficulty,
             count(*)::int AS total,
             count(s."problemId")::int AS solved
      FROM "Problem" p
      LEFT JOIN (
        SELECT DISTINCT "problemId"
        FROM "Submission"
        WHERE "userId" = ${userId} AND "status" = 'ACCEPTED'
      ) s ON s."problemId" = p."id"
      WHERE p."isPublished" = true
      GROUP BY p."difficulty"
    `);
    const byDifficulty: Record<AssessmentDifficulty, DifficultyCount> = {
      EASY: { solved: 0, total: 0 },
      MEDIUM: { solved: 0, total: 0 },
      HARD: { solved: 0, total: 0 },
    };
    for (const row of rows) {
      if (isDifficulty(row.difficulty)) {
        byDifficulty[row.difficulty] = { solved: Number(row.solved), total: Number(row.total) };
      }
    }
    return {
      solved: DIFFICULTIES.reduce((sum, key) => sum + byDifficulty[key].solved, 0),
      total: DIFFICULTIES.reduce((sum, key) => sum + byDifficulty[key].total, 0),
      byDifficulty,
    };
  }

  async listTopTopics(userId: string, limit: number): Promise<TopicSolvedCount[]> {
    const rows = await this.prisma.$queryRaw<TopicRow[]>(Prisma.sql`
      SELECT t."slug", t."name", count(*)::int AS solved
      FROM (
        SELECT DISTINCT "problemId"
        FROM "Submission"
        WHERE "userId" = ${userId} AND "status" = 'ACCEPTED'
      ) s
      JOIN "Problem" p ON p."id" = s."problemId" AND p."isPublished" = true
      JOIN "ProblemTopic" pt ON pt."problemId" = p."id"
      JOIN "Topic" t ON t."id" = pt."topicId"
      GROUP BY t."id", t."slug", t."name"
      ORDER BY solved DESC, t."name" ASC
      LIMIT ${limit}
    `);
    return rows.map((row) => ({ slug: row.slug, name: row.name, solved: Number(row.solved) }));
  }

  async listBadges(userId: string): Promise<EarnedBadge[]> {
    const rows = await this.prisma.userBadge.findMany({
      where: { userId, badge: { isActive: true } },
      orderBy: { awardedAt: 'desc' },
      select: {
        awardedAt: true,
        badge: { select: { key: true, name: true, description: true, icon: true } },
      },
    });
    return rows.map((row) => ({ ...row.badge, awardedAt: row.awardedAt }));
  }

  async listRecentSolves(userId: string, limit: number): Promise<RecentSolve[]> {
    const rows = await this.prisma.$queryRaw<RecentSolveRow[]>(Prisma.sql`
      SELECT p."slug", p."title", p."difficulty"::text AS difficulty, s."solvedAt"
      FROM (
        SELECT "problemId", min("createdAt") AS "solvedAt"
        FROM "Submission"
        WHERE "userId" = ${userId} AND "status" = 'ACCEPTED'
        GROUP BY "problemId"
      ) s
      JOIN "Problem" p ON p."id" = s."problemId" AND p."isPublished" = true
      ORDER BY s."solvedAt" DESC
      LIMIT ${limit}
    `);
    return rows.flatMap((row) =>
      isDifficulty(row.difficulty)
        ? [
            {
              slug: row.slug,
              title: row.title,
              difficulty: row.difficulty,
              solvedAt: new Date(row.solvedAt),
            },
          ]
        : [],
    );
  }

  async findSettings(userId: string): Promise<PublicProfileSettingsRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SETTINGS_SELECT,
    });
    return row ? toSettings(row) : null;
  }

  async findUserIdByHandle(handle: string): Promise<string | null> {
    const row = await this.prisma.user.findUnique({ where: { handle }, select: { id: true } });
    return row?.id ?? null;
  }

  async saveSettings(userId: string, settings: PublicProfileSettingsWrite): Promise<void> {
    try {
      await this.prisma.user.update({ where: { id: userId }, data: settings });
    } catch (error) {
      if (settings.handle !== null && isUniqueConstraintViolation(error)) {
        throw new HandleTakenError(settings.handle);
      }
      throw error;
    }
  }
}
