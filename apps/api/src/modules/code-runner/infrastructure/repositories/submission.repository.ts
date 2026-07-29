import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ISubmissionRepository,
  SubmissionListFilter,
} from '../../domain/interfaces/submission-repository.interface';
import { Submission } from '../../domain/entities/submission';
import { SubmissionListPage } from '../../domain/read-models/submission-summary-view';
import { SubmissionMapper } from '../mappers/submission.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class SubmissionRepository implements ISubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(submission: Submission): Promise<Submission> {
    const record = await this.prisma.submission.create({
      data: {
        id: submission.getId(),
        userId: submission.getUserId(),
        problemId: submission.getProblemId(),
        language: submission.getLanguage(),
        sourceCode: submission.getSourceCode(),
        status: submission.getStatus(),
        passedCount: submission.getPassedCount(),
        totalCount: submission.getTotalCount(),
        totalRuntimeMs: submission.getTotalRuntimeMs(),
        peakMemoryKb: submission.getPeakMemoryKb(),
        stdout: submission.getStdout(),
        results: { create: this.toResultRows(submission) },
      },
      include: { results: true },
    });
    return SubmissionMapper.toDomain(record);
  }

  async update(submission: Submission): Promise<Submission> {
    const record = await this.prisma.submission.update({
      where: { id: submission.getId() },
      data: {
        status: submission.getStatus(),
        passedCount: submission.getPassedCount(),
        totalCount: submission.getTotalCount(),
        totalRuntimeMs: submission.getTotalRuntimeMs(),
        peakMemoryKb: submission.getPeakMemoryKb(),
        stdout: submission.getStdout(),
        results: { deleteMany: {}, create: this.toResultRows(submission) },
      },
      include: { results: true },
    });
    return SubmissionMapper.toDomain(record);
  }

  async findById(id: string): Promise<Submission | null> {
    const record = await this.prisma.submission.findUnique({
      where: { id },
      include: { results: true },
    });
    return record ? SubmissionMapper.toDomain(record) : null;
  }

  async findForUser(userId: string, filter: SubmissionListFilter): Promise<SubmissionListPage> {
    const where: Prisma.SubmissionWhereInput = {
      userId,
      ...(filter.problemId ? { problemId: filter.problemId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.language ? { language: filter.language } : {}),
    };
    const [records, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
        include: { problem: { select: { title: true, difficulty: true } } },
      }),
      this.prisma.submission.count({ where }),
    ]);
    return {
      items: records.map((record) => ({
        id: record.id,
        problemId: record.problemId,
        problemTitle: record.problem.title,
        problemDifficulty: record.problem.difficulty,
        language: record.language,
        status: record.status,
        passedCount: record.passedCount,
        totalCount: record.totalCount,
        totalRuntimeMs: record.totalRuntimeMs,
        peakMemoryKb: record.peakMemoryKb,
        createdAt: record.createdAt,
      })),
      total,
    };
  }

  private toResultRows(
    submission: Submission,
  ): Prisma.SubmissionResultCreateWithoutSubmissionInput[] {
    return submission.getResults().map((result) => ({
      id: result.getId(),
      testCaseId: result.getTestCaseId(),
      label: result.getLabel(),
      status: result.getStatus(),
      actualOutput: result.getActualOutput(),
      runtimeMs: result.getRuntimeMs(),
      memoryKb: result.getMemoryKb(),
      isHidden: result.isHidden(),
    }));
  }
}
