import { Injectable } from '@nestjs/common';
import { AssessmentDifficulty, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { isUniqueConstraintViolation } from '../../../../infrastructure/prisma/prisma-errors';
import { IPointLedgerRepository } from '../../domain/interfaces/point-ledger-repository.interface';
import { NON_PERIOD_SOURCES, PointAward } from '../../domain/entities/point-award';
import { PointPeriod } from '../../domain/point-periods';
import { PointAwardMapper } from '../mappers/point-award.mapper';

const PERIOD_TOTALS_LOCK_NAME = 'leaderboard.period-totals';
const LEDGER_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

const PERIOD_COLUMNS: Readonly<Record<PointPeriod, Prisma.Sql>> = {
  weekly: Prisma.raw('"weeklyPoints"'),
  monthly: Prisma.raw('"monthlyPoints"'),
};

type LedgerWork = (transaction: Prisma.TransactionClient) => Promise<boolean>;

@Injectable()
export class PointLedgerRepository implements IPointLedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async award(award: PointAward): Promise<boolean> {
    return this.withinLedgerTransaction(async (transaction) => {
      await applyAward(transaction, award);
      return true;
    });
  }

  async adjustTo(userId: string, targetPoints: number, adjustmentId: string): Promise<boolean> {
    return this.withinLedgerTransaction(async (transaction) => {
      const [current] = await transaction.$queryRaw<{ points: number }[]>`
        SELECT "points" FROM "UserStats" WHERE "userId" = ${userId} FOR UPDATE`;
      if (!current) {
        return false;
      }
      const award = PointAward.adminAdjustmentTo(
        userId,
        adjustmentId,
        current.points,
        targetPoints,
      );
      if (!award) {
        return false;
      }
      await applyAward(transaction, award);
      return true;
    });
  }

  async findProblemDifficulty(problemId: string): Promise<AssessmentDifficulty | null> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { difficulty: true },
    });
    return problem?.difficulty ?? null;
  }

  async recalculatePeriodTotals(period: PointPeriod, since: Date): Promise<number> {
    const column = PERIOD_COLUMNS[period];
    const excludedSources = Prisma.join(
      NON_PERIOD_SOURCES.map((source) => Prisma.sql`${source}::"PointSource"`),
    );
    const [, updatedCount] = await this.prisma.$transaction([
      this.prisma.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${PERIOD_TOTALS_LOCK_NAME}))`,
      this.prisma.$executeRaw`
        UPDATE "UserStats" AS stats
        SET ${column} = totals.total
        FROM (
          SELECT member."userId", COALESCE(SUM(ledger."delta"), 0)::int AS total
          FROM "UserStats" AS member
          LEFT JOIN "PointLedger" AS ledger
            ON ledger."userId" = member."userId"
            AND ledger."createdAt" >= (${since.toISOString()}::timestamptz AT TIME ZONE 'UTC')
            AND ledger."source" NOT IN (${excludedSources})
          GROUP BY member."userId"
        ) AS totals
        WHERE stats."userId" = totals."userId" AND stats.${column} <> totals.total`,
    ]);
    return updatedCount;
  }

  private async withinLedgerTransaction(work: LedgerWork): Promise<boolean> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock_shared(hashtext(${PERIOD_TOTALS_LOCK_NAME}))`;
        return work(transaction);
      }, LEDGER_TRANSACTION_OPTIONS);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        return false;
      }
      throw error;
    }
  }
}

async function applyAward(transaction: Prisma.TransactionClient, award: PointAward): Promise<void> {
  const userId = award.getUserId();
  const user = await transaction.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tenantId: true },
  });
  await transaction.pointLedger.create({
    data: PointAwardMapper.toLedgerRecord(award, user.tenantId),
  });
  await transaction.userStats.upsert({
    where: { userId },
    update: PointAwardMapper.toStatsIncrement(award),
    create: PointAwardMapper.toStatsCreate(award),
  });
}
