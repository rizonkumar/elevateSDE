import { Injectable } from '@nestjs/common';
import { AssessmentDifficulty } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { isUniqueConstraintViolation } from '../../../../infrastructure/prisma/prisma-errors';
import { IPointLedgerRepository } from '../../domain/interfaces/point-ledger-repository.interface';
import { PointAward } from '../../domain/entities/point-award';
import { PointAwardMapper } from '../mappers/point-award.mapper';

@Injectable()
export class PointLedgerRepository implements IPointLedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async award(award: PointAward): Promise<boolean> {
    const userId = award.getUserId();
    try {
      await this.prisma.$transaction(async (transaction) => {
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
      });
      return true;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  async findProblemDifficulty(problemId: string): Promise<AssessmentDifficulty | null> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { difficulty: true },
    });
    return problem?.difficulty ?? null;
  }

  async resetWeeklyPoints(): Promise<number> {
    const result = await this.prisma.userStats.updateMany({
      where: { weeklyPoints: { not: 0 } },
      data: { weeklyPoints: 0 },
    });
    return result.count;
  }

  async resetMonthlyPoints(): Promise<number> {
    const result = await this.prisma.userStats.updateMany({
      where: { monthlyPoints: { not: 0 } },
      data: { monthlyPoints: 0 },
    });
    return result.count;
  }
}
