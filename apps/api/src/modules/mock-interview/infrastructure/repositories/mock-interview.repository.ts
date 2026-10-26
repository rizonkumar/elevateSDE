import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { MockInterviewSession } from '../../domain/entities/mock-interview-session';
import {
  IMockInterviewRepository,
  MockInterviewHistoryPage,
} from '../../domain/interfaces/mock-interview-repository.interface';
import { MockInterviewMapper, SESSION_WITH_TURNS } from '../mappers/mock-interview.mapper';

const ACTIVE_LOCK_PREFIX = 'mock-interview-active:';

@Injectable()
export class MockInterviewRepository implements IMockInterviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MockInterviewSession | null> {
    const record = await this.prisma.mockInterviewSession.findUnique({
      where: { id },
      include: SESSION_WITH_TURNS,
    });
    return record ? MockInterviewMapper.toDomain(record) : null;
  }

  async findOwned(userId: string, id: string): Promise<MockInterviewSession | null> {
    const record = await this.prisma.mockInterviewSession.findFirst({
      where: { id, userId },
      include: SESSION_WITH_TURNS,
    });
    return record ? MockInterviewMapper.toDomain(record) : null;
  }

  async findActiveForUser(userId: string): Promise<MockInterviewSession | null> {
    const record = await this.prisma.mockInterviewSession.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' },
      include: SESSION_WITH_TURNS,
    });
    return record ? MockInterviewMapper.toDomain(record) : null;
  }

  countStartedSince(userId: string, since: Date): Promise<number> {
    return this.prisma.mockInterviewSession.count({
      where: { userId, startedAt: { gte: since } },
    });
  }

  async isOwnedMockInterviewTask(userId: string, taskId: string): Promise<boolean> {
    const task = await this.prisma.preparationTask.findFirst({
      where: { id: taskId, type: 'RUN_MOCK_INTERVIEW', plan: { userId, status: 'ACTIVE' } },
      select: { id: true },
    });
    return task !== null;
  }

  async createIfNoActive(session: MockInterviewSession): Promise<'CREATED' | 'ACTIVE_EXISTS'> {
    const state = session.toState();
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ACTIVE_LOCK_PREFIX + state.userId}))`;
      const active = await transaction.mockInterviewSession.count({
        where: { userId: state.userId, status: 'ACTIVE' },
      });
      if (active > 0) return 'ACTIVE_EXISTS';
      await transaction.mockInterviewSession.create({
        data: {
          id: state.id,
          userId: state.userId,
          tenantId: state.tenantId,
          topic: state.config.topic,
          roleLevel: state.config.roleLevel,
          companyStyle: state.config.companyStyle,
          durationMinutes: state.config.durationMinutes,
          status: state.status,
          engine: state.engine,
          preparationTaskId: state.preparationTaskId,
          startedAt: state.startedAt,
          deadlineAt: state.deadlineAt,
          turns: {
            create: state.turns.map((turn) => ({
              id: turn.id,
              ordinal: turn.ordinal,
              question: turn.question,
              askedAt: turn.askedAt,
            })),
          },
        },
      });
      return 'CREATED';
    });
  }

  async save(session: MockInterviewSession): Promise<'SAVED' | 'VERSION_CONFLICT'> {
    const state = session.toState();
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.mockInterviewSession.updateMany({
        where: { id: state.id, version: state.version },
        data: {
          status: state.status,
          engine: state.engine,
          endedAt: state.endedAt,
          overallScore: state.report?.overallScore ?? null,
          competencies: state.report
            ? MockInterviewMapper.toCompetenciesJson(state.report.competencies)
            : Prisma.DbNull,
          strengths: state.report?.strengths ?? [],
          improvements: state.report?.improvements ?? [],
          summary: state.report?.summary ?? null,
          failureReason: state.failureReason,
          version: { increment: 1 },
        },
      });
      if (updated.count === 0) return 'VERSION_CONFLICT';
      for (const turn of state.turns) {
        const values = {
          question: turn.question,
          askedAt: turn.askedAt,
          answer: turn.answer,
          answeredAt: turn.answeredAt,
          scores: MockInterviewMapper.toScoresJson(turn.dimensionScores),
          score: turn.score,
          feedback: turn.feedback,
        };
        await transaction.mockInterviewTurn.upsert({
          where: { sessionId_ordinal: { sessionId: state.id, ordinal: turn.ordinal } },
          create: { id: turn.id, sessionId: state.id, ordinal: turn.ordinal, ...values },
          update: values,
        });
      }
      return 'SAVED';
    });
  }

  async listForUser(
    userId: string,
    limit: number,
    cursor: string | null,
  ): Promise<MockInterviewHistoryPage> {
    const records = await this.prisma.mockInterviewSession.findMany({
      where: { userId },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { _count: { select: { turns: { where: { answer: { not: null } } } } } },
    });
    const page = records.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map((record) => MockInterviewMapper.toSummary(record)),
      nextCursor: records.length > limit && last ? last.id : null,
    };
  }

  async findOverdueActiveIds(deadlineBefore: Date, limit: number): Promise<string[]> {
    const records = await this.prisma.mockInterviewSession.findMany({
      where: { status: 'ACTIVE', deadlineAt: { lt: deadlineBefore } },
      orderBy: { deadlineAt: 'asc' },
      take: limit,
      select: { id: true },
    });
    return records.map((record) => record.id);
  }

  async findStaleScoringIds(endedBefore: Date, limit: number): Promise<string[]> {
    const records = await this.prisma.mockInterviewSession.findMany({
      where: { status: 'SCORING', endedAt: { lt: endedBefore } },
      orderBy: { endedAt: 'asc' },
      take: limit,
      select: { id: true },
    });
    return records.map((record) => record.id);
  }
}
