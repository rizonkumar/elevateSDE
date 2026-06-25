import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IDailyChallengeRepository } from '../../domain/interfaces/daily-challenge-repository.interface';
import { DailyChallenge } from '../../domain/entities/daily-challenge';
import { StreakState } from '../../domain/entities/streak-state';
import {
  DailyChallengeScheduleView,
  DailyChallengeView,
  PublishedProblemRef,
  ScheduledChallengeRef,
} from '../../domain/read-models/daily-challenge-view';
import { DailyChallengeMapper } from '../mappers/daily-challenge.mapper';

@Injectable()
export class DailyChallengeRepository implements IDailyChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDailyView(
    challengeDate: Date,
    tenantId: string | null,
    userId: string,
  ): Promise<DailyChallengeView | null> {
    const challenge = await this.prisma.dailyChallenge.findFirst({
      where: { challengeDate, tenantId },
      include: {
        problem: { select: { id: true, title: true, difficulty: true, tags: true, timeLimitMinutes: true } },
        completions: { where: { userId }, select: { id: true }, take: 1 },
      },
    });
    if (!challenge) {
      return null;
    }
    return {
      id: challenge.id,
      challengeDate: challenge.challengeDate,
      problem: {
        id: challenge.problem.id,
        title: challenge.problem.title,
        difficulty: challenge.problem.difficulty,
        tags: challenge.problem.tags,
        timeLimitMinutes: challenge.problem.timeLimitMinutes,
      },
      completed: challenge.completions.length > 0,
    };
  }

  async findScheduledForDate(
    challengeDate: Date,
    tenantId: string | null,
  ): Promise<ScheduledChallengeRef | null> {
    return this.prisma.dailyChallenge.findFirst({
      where: { challengeDate, tenantId },
      select: { id: true, problemId: true },
    });
  }

  async hasCompletion(userId: string, dailyChallengeId: string): Promise<boolean> {
    const record = await this.prisma.dailyChallengeCompletion.findUnique({
      where: { userId_dailyChallengeId: { userId, dailyChallengeId } },
      select: { id: true },
    });
    return record !== null;
  }

  async recordCompletion(
    userId: string,
    dailyChallengeId: string,
    submissionId: string,
  ): Promise<void> {
    await this.prisma.dailyChallengeCompletion.create({
      data: { id: randomUUID(), userId, dailyChallengeId, submissionId },
    });
  }

  async findStreakState(userId: string): Promise<StreakState | null> {
    const record = await this.prisma.userStats.findUnique({
      where: { userId },
      select: { streakDays: true, longestStreak: true, lastActiveDate: true },
    });
    if (!record) {
      return null;
    }
    return StreakState.create({
      streakDays: record.streakDays,
      longestStreak: record.longestStreak,
      lastActiveDate: record.lastActiveDate,
    });
  }

  async saveStreakState(userId: string, state: StreakState): Promise<void> {
    const streakDays = state.getStreakDays();
    const longestStreak = state.getLongestStreak();
    const lastActiveDate = state.getLastActiveDate();
    await this.prisma.userStats.upsert({
      where: { userId },
      update: { streakDays, longestStreak, lastActiveDate },
      create: { userId, streakDays, longestStreak, lastActiveDate },
    });
  }

  async listCompletionDates(userId: string, from: Date, to: Date): Promise<Date[]> {
    const rows = await this.prisma.dailyChallengeCompletion.findMany({
      where: { userId, dailyChallenge: { challengeDate: { gte: from, lte: to } } },
      select: { dailyChallenge: { select: { challengeDate: true } } },
    });
    return rows.map((row) => row.dailyChallenge.challengeDate);
  }

  async listSchedule(
    from: Date,
    to: Date,
    tenantId: string | null,
  ): Promise<DailyChallengeScheduleView[]> {
    const rows = await this.prisma.dailyChallenge.findMany({
      where: { tenantId, challengeDate: { gte: from, lte: to } },
      orderBy: { challengeDate: 'desc' },
      include: {
        problem: { select: { title: true, difficulty: true } },
        _count: { select: { completions: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      challengeDate: row.challengeDate,
      problemId: row.problemId,
      problemTitle: row.problem.title,
      difficulty: row.problem.difficulty,
      completionCount: row._count.completions,
    }));
  }

  async findById(id: string): Promise<DailyChallenge | null> {
    const record = await this.prisma.dailyChallenge.findUnique({ where: { id } });
    if (!record) {
      return null;
    }
    return DailyChallengeMapper.toDomain(record);
  }

  async findPublishedProblem(problemId: string): Promise<PublishedProblemRef | null> {
    return this.prisma.problem.findFirst({
      where: { id: problemId, isPublished: true },
      select: { id: true, title: true, difficulty: true },
    });
  }

  async schedule(challenge: DailyChallenge): Promise<void> {
    await this.prisma.dailyChallenge.create({
      data: DailyChallengeMapper.toPersistence(challenge),
    });
  }

  async unschedule(id: string): Promise<void> {
    await this.prisma.dailyChallenge.delete({ where: { id } });
  }
}
