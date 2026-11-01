import { Injectable } from '@nestjs/common';
import { ContestStatus, EditorialUnlockReason } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IProblemAssistanceRepository } from '../../domain/interfaces/problem-assistance-repository.interface';
import { ProblemAssistance } from '../../domain/entities/problem-assistance';
import {
  EditorialWriteInput,
  ProblemEditorialContent,
  ProblemHintContent,
} from '../../domain/read-models/problem-guidance';
import { ProblemAssistanceMapper } from '../mappers/problem-assistance.mapper';

@Injectable()
export class ProblemAssistanceRepository implements IProblemAssistanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAssistance(userId: string, problemId: string): Promise<ProblemAssistance | null> {
    const record = await this.prisma.problemAssistance.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    return record ? ProblemAssistanceMapper.toDomain(record) : null;
  }

  async countHints(problemId: string): Promise<number> {
    return this.prisma.problemHint.count({ where: { problemId } });
  }

  async findHints(problemId: string, limit: number): Promise<ProblemHintContent[]> {
    if (limit <= 0) {
      return [];
    }
    const records = await this.prisma.problemHint.findMany({
      where: { problemId },
      orderBy: { ordinal: 'asc' },
      take: limit,
      select: { ordinal: true, content: true },
    });
    return records.map((record) => ({ ordinal: record.ordinal, content: record.content }));
  }

  async findEditorial(problemId: string): Promise<ProblemEditorialContent | null> {
    const record = await this.prisma.problemEditorial.findUnique({ where: { problemId } });
    return record ? ProblemAssistanceMapper.toEditorialContent(record) : null;
  }

  async revealNextHint(
    userId: string,
    problemId: string,
    expectedRevealed: number,
  ): Promise<boolean> {
    await this.ensureRow(userId, problemId);
    const result = await this.prisma.problemAssistance.updateMany({
      where: { userId, problemId, hintsRevealed: expectedRevealed },
      data: { hintsRevealed: { increment: 1 } },
    });
    return result.count === 1;
  }

  async unlockEditorial(
    userId: string,
    problemId: string,
    reason: EditorialUnlockReason,
    unlockedAt: Date,
  ): Promise<void> {
    await this.ensureRow(userId, problemId);
    await this.prisma.problemAssistance.updateMany({
      where: { userId, problemId, editorialUnlockedAt: null },
      data: { editorialUnlockedAt: unlockedAt, editorialUnlockReason: reason },
    });
  }

  async isLockedByLiveContest(userId: string, problemId: string, now: Date): Promise<boolean> {
    const match = await this.prisma.contestProblem.findFirst({
      where: {
        problemId,
        contest: {
          status: ContestStatus.LIVE,
          startsAt: { lte: now },
          endsAt: { gt: now },
          participants: { some: { userId } },
        },
      },
      select: { id: true },
    });
    return match !== null;
  }

  async replaceHints(problemId: string, hints: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.problemHint.deleteMany({ where: { problemId } }),
      this.prisma.problemHint.createMany({
        data: hints.map((content, index) => ({ problemId, ordinal: index + 1, content })),
      }),
    ]);
  }

  async upsertEditorial(problemId: string, input: EditorialWriteInput): Promise<void> {
    await this.prisma.problemEditorial.upsert({
      where: { problemId },
      create: { problemId, ...input },
      update: input,
    });
  }

  private async ensureRow(userId: string, problemId: string): Promise<void> {
    const existing = await this.prisma.problemAssistance.findUnique({
      where: { userId_problemId: { userId, problemId } },
      select: { id: true },
    });
    if (existing) {
      return;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    await this.prisma.problemAssistance.createMany({
      data: [{ userId, problemId, tenantId: user?.tenantId ?? null }],
      skipDuplicates: true,
    });
  }
}
