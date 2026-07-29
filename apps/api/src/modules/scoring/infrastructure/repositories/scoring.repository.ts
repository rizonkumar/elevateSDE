import { Injectable } from '@nestjs/common';
import { AssessmentDifficulty, Prisma, PointsSource } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IScoringRepository } from '../../domain/interfaces/scoring-repository.interface';
import { PointsAward } from '../../domain/entities/points-award';
import { DIFFICULTY_POINTS } from '../../domain/points-policy';
import { PointsBackfillResult } from '../../domain/read-models/scoring-result';
import { PointsAwardMapper } from '../mappers/points-award.mapper';

interface BackfillTotals {
  usersTouched: number;
  awardsInserted: number;
  pointsAwarded: number;
}

class DryRunRollback extends Error {
  constructor(readonly totals: BackfillTotals) {
    super('Dry run rollback');
  }
}

@Injectable()
export class ScoringRepository implements IScoringRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDifficulty(problemId: string): Promise<AssessmentDifficulty | null> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { difficulty: true },
    });
    return problem?.difficulty ?? null;
  }

  async awardFirstSolve(award: PointsAward): Promise<boolean> {
    const points = award.getPoints();
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.pointsAward.createMany({
        data: [PointsAwardMapper.toPersistence(award)],
        skipDuplicates: true,
      });
      if (count === 0) {
        return false;
      }
      await tx.userStats.upsert({
        where: { userId: award.getUserId() },
        update: {
          points: { increment: points },
          weeklyPoints: { increment: points },
          monthlyPoints: { increment: points },
          assessmentsCompleted: { increment: 1 },
        },
        create: {
          userId: award.getUserId(),
          points,
          weeklyPoints: points,
          monthlyPoints: points,
          assessmentsCompleted: 1,
        },
      });
      return true;
    });
  }

  async recomputeWeeklyBucket(weekStart: Date): Promise<number> {
    return this.recomputeBucket('weeklyPoints', weekStart);
  }

  async recomputeMonthlyBucket(monthStart: Date): Promise<number> {
    return this.recomputeBucket('monthlyPoints', monthStart);
  }

  async listUsersWithAwards(): Promise<string[]> {
    const rows = await this.prisma.pointsAward.findMany({
      distinct: ['userId'],
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }

  async backfillFromHistory(
    weekStart: Date,
    monthStart: Date,
    dryRun: boolean,
  ): Promise<PointsBackfillResult> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "UserStats" ("userId", "badges", "updatedAt")
          SELECT DISTINCT s."userId", ARRAY[]::text[], now()
          FROM "Submission" s
          ON CONFLICT ("userId") DO NOTHING
        `);
        const awardsInserted = await tx.$executeRaw(Prisma.sql`
          INSERT INTO "PointsAward" ("id", "userId", "source", "sourceRef", "points", "awardedAt")
          SELECT
            gen_random_uuid(),
            s."userId",
            ${PointsSource.FIRST_SOLVE}::"PointsSource",
            s."problemId",
            CASE p."difficulty"
              WHEN 'EASY' THEN ${DIFFICULTY_POINTS.EASY}
              WHEN 'MEDIUM' THEN ${DIFFICULTY_POINTS.MEDIUM}
              ELSE ${DIFFICULTY_POINTS.HARD}
            END,
            MIN(s."createdAt")
          FROM "Submission" s
          JOIN "Problem" p ON p."id" = s."problemId"
          WHERE s."status" = 'ACCEPTED'
          GROUP BY s."userId", s."problemId", p."difficulty"
          ON CONFLICT ("userId", "source", "sourceRef") DO NOTHING
        `);
        await tx.$executeRaw(Prisma.sql`
          UPDATE "UserStats" u
          SET "points" = COALESCE(agg."total", 0),
              "assessmentsCompleted" = COALESCE(agg."solves", 0),
              "updatedAt" = now()
          FROM (
            SELECT stats."userId",
                   SUM(a."points")::int AS "total",
                   COUNT(a."id")::int AS "solves"
            FROM "UserStats" stats
            LEFT JOIN "PointsAward" a ON a."userId" = stats."userId"
            GROUP BY stats."userId"
          ) agg
          WHERE agg."userId" = u."userId"
        `);
        await this.recomputeBucketWithin(tx, 'weeklyPoints', weekStart);
        await this.recomputeBucketWithin(tx, 'monthlyPoints', monthStart);
        const totals = await this.summariseAwards(tx);
        const outcome: BackfillTotals = { ...totals, awardsInserted };
        if (dryRun) {
          throw new DryRunRollback(outcome);
        }
        return outcome;
      });
      return { ...result, dryRun };
    } catch (error) {
      if (error instanceof DryRunRollback) {
        return { ...error.totals, dryRun };
      }
      throw error;
    }
  }

  private async summariseAwards(
    tx: Prisma.TransactionClient,
  ): Promise<Pick<BackfillTotals, 'usersTouched' | 'pointsAwarded'>> {
    const rows = await tx.$queryRaw<Array<{ users: number | null; total: number | null }>>(
      Prisma.sql`
        SELECT COUNT(DISTINCT "userId")::int AS users, SUM("points")::int AS total
        FROM "PointsAward"
      `,
    );
    const row = rows[0];
    return {
      usersTouched: Number(row?.users ?? 0),
      pointsAwarded: Number(row?.total ?? 0),
    };
  }

  private async recomputeBucket(
    column: 'weeklyPoints' | 'monthlyPoints',
    windowStart: Date,
  ): Promise<number> {
    return this.recomputeBucketWithin(this.prisma, column, windowStart);
  }

  private async recomputeBucketWithin(
    client: Prisma.TransactionClient | PrismaService,
    column: 'weeklyPoints' | 'monthlyPoints',
    windowStart: Date,
  ): Promise<number> {
    const target = column === 'weeklyPoints' ? Prisma.raw('"weeklyPoints"') : Prisma.raw('"monthlyPoints"');
    return client.$executeRaw(Prisma.sql`
      UPDATE "UserStats" u
      SET ${target} = COALESCE(agg."total", 0),
          "updatedAt" = now()
      FROM (
        SELECT stats."userId",
               SUM(CASE WHEN a."awardedAt" >= ${windowStart} THEN a."points" ELSE 0 END)::int AS "total"
        FROM "UserStats" stats
        LEFT JOIN "PointsAward" a ON a."userId" = stats."userId"
        GROUP BY stats."userId"
      ) agg
      WHERE agg."userId" = u."userId"
    `);
  }
}
