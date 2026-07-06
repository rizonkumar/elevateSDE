import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IContestRepository } from '../../domain/interfaces/contest-repository.interface';
import { Contest } from '../../domain/entities/contest';
import {
  ContestDetailView,
  ContestProblemAssignment,
  ContestSummaryView,
  PublishedProblemRef,
} from '../../domain/read-models/contest-view';
import { ContestMapper } from '../mappers/contest.mapper';

@Injectable()
export class ContestRepository implements IContestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ContestSummaryView[]> {
    const rows = await this.prisma.contest.findMany({
      orderBy: { startsAt: 'desc' },
      include: { _count: { select: { problems: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      problemCount: row._count.problems,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async findDetail(id: string): Promise<ContestDetailView | null> {
    const row = await this.prisma.contest.findUnique({
      where: { id },
      include: {
        problems: {
          orderBy: { ordinal: 'asc' },
          include: { problem: { select: { title: true, difficulty: true } } },
        },
      },
    });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      status: row.status,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      problemCount: row.problems.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      problems: row.problems.map((entry) => ({
        id: entry.id,
        problemId: entry.problemId,
        title: entry.problem.title,
        difficulty: entry.problem.difficulty,
        ordinal: entry.ordinal,
        points: entry.points,
      })),
    };
  }

  async findById(id: string): Promise<Contest | null> {
    const record = await this.prisma.contest.findUnique({ where: { id } });
    if (!record) {
      return null;
    }
    return ContestMapper.toDomain(record);
  }

  async findIdBySlug(slug: string): Promise<string | null> {
    const record = await this.prisma.contest.findUnique({
      where: { slug },
      select: { id: true },
    });
    return record?.id ?? null;
  }

  async findPublishedProblems(problemIds: string[]): Promise<PublishedProblemRef[]> {
    return this.prisma.problem.findMany({
      where: { id: { in: problemIds }, isPublished: true },
      select: { id: true, title: true, difficulty: true },
    });
  }

  async countProblems(contestId: string): Promise<number> {
    return this.prisma.contestProblem.count({ where: { contestId } });
  }

  async create(contest: Contest): Promise<void> {
    await this.prisma.contest.create({ data: ContestMapper.toPersistence(contest) });
  }

  async update(contest: Contest): Promise<void> {
    const data = ContestMapper.toPersistence(contest);
    await this.prisma.contest.update({ where: { id: data.id }, data });
  }

  async setProblems(contestId: string, assignments: ContestProblemAssignment[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.contestProblem.deleteMany({ where: { contestId } }),
      this.prisma.contestProblem.createMany({
        data: assignments.map((assignment) => ({
          id: randomUUID(),
          contestId,
          problemId: assignment.problemId,
          ordinal: assignment.ordinal,
          points: assignment.points,
        })),
      }),
    ]);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.contest.delete({ where: { id } });
  }
}
