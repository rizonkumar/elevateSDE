import { Injectable } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ReviewItem } from '../../domain/entities/review-item';
import { IReviewRepository } from '../../domain/interfaces/review-repository.interface';
import { ReviewItemView, ReviewProblemView } from '../../domain/read-models/review-item-view';
import { ReviewItemMapper } from '../mappers/review-item.mapper';

const PROBLEM_SUMMARY_SELECT = {
  id: true,
  title: true,
  difficulty: true,
  tags: true,
  timeLimitMinutes: true,
} as const;

interface ReviewItemRow {
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  problem: ReviewProblemView;
}

function toView(row: ReviewItemRow): ReviewItemView {
  return {
    problem: {
      id: row.problem.id,
      title: row.problem.title,
      difficulty: row.problem.difficulty,
      tags: row.problem.tags,
      timeLimitMinutes: row.problem.timeLimitMinutes,
    },
    ease: row.ease,
    intervalDays: row.intervalDays,
    repetitions: row.repetitions,
    dueAt: row.dueAt,
    lastReviewedAt: row.lastReviewedAt,
  };
}

@Injectable()
export class ReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndProblem(userId: string, problemId: string): Promise<ReviewItem | null> {
    const record = await this.prisma.reviewItem.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    return record ? ReviewItemMapper.toDomain(record) : null;
  }

  async createIfAbsent(item: ReviewItem): Promise<void> {
    await this.prisma.reviewItem.upsert({
      where: { userId_problemId: { userId: item.getUserId(), problemId: item.getProblemId() } },
      update: {},
      create: ReviewItemMapper.toPersistence(item),
    });
  }

  async createManyIfAbsent(items: ReviewItem[]): Promise<void> {
    await this.prisma.reviewItem.createMany({
      data: items.map((item) => ReviewItemMapper.toPersistence(item)),
      skipDuplicates: true,
    });
  }

  async save(item: ReviewItem): Promise<void> {
    await this.prisma.reviewItem.update({
      where: { id: item.getId() },
      data: ReviewItemMapper.toScheduleUpdate(item),
    });
  }

  async hasAny(userId: string): Promise<boolean> {
    const record = await this.prisma.reviewItem.findFirst({
      where: { userId },
      select: { id: true },
    });
    return record !== null;
  }

  async findAcceptedProblemIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.submission.findMany({
      where: { userId, status: SubmissionStatus.ACCEPTED },
      distinct: ['problemId'],
      select: { problemId: true },
    });
    return rows.map((row) => row.problemId);
  }

  async findDueViews(userId: string, dueBefore: Date, limit: number): Promise<ReviewItemView[]> {
    const rows = await this.prisma.reviewItem.findMany({
      where: { userId, dueAt: { lte: dueBefore } },
      orderBy: { dueAt: 'asc' },
      take: limit,
      include: { problem: { select: PROBLEM_SUMMARY_SELECT } },
    });
    return rows.map(toView);
  }

  async findViewByUserAndProblem(
    userId: string,
    problemId: string,
  ): Promise<ReviewItemView | null> {
    const row = await this.prisma.reviewItem.findUnique({
      where: { userId_problemId: { userId, problemId } },
      include: { problem: { select: PROBLEM_SUMMARY_SELECT } },
    });
    return row ? toView(row) : null;
  }
}
