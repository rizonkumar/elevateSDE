import { Injectable } from '@nestjs/common';
import { AssessmentLanguage, Prisma, SubmissionStatus } from '@prisma/client';
import {
  ISubmissionRepository,
  SubmissionPage,
} from '../../domain/interfaces/submission-repository.interface';
import { BestRun } from '../../domain/insights/performance-insights';
import { Submission } from '../../domain/entities/submission';
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
        runtimePercentile: submission.getRuntimePercentile(),
        memoryPercentile: submission.getMemoryPercentile(),
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

  async findPageByUserAndProblem(
    userId: string,
    problemId: string,
    limit: number,
    cursor: string | null,
  ): Promise<SubmissionPage> {
    const records = await this.prisma.submission.findMany({
      where: { userId, problemId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const page = records.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map((record) => SubmissionMapper.toDomain(record)),
      nextCursor: records.length > limit && last ? last.id : null,
    };
  }

  async findBestAcceptedRuns(
    problemId: string,
    language: AssessmentLanguage,
    excludeUserId: string | null,
  ): Promise<BestRun[]> {
    const grouped = await this.prisma.submission.groupBy({
      by: ['userId'],
      where: {
        problemId,
        language,
        status: SubmissionStatus.ACCEPTED,
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      _min: { totalRuntimeMs: true, peakMemoryKb: true },
    });
    return grouped.map((row) => ({
      userId: row.userId,
      runtimeMs: row._min.totalRuntimeMs ?? 0,
      memoryKb: row._min.peakMemoryKb ?? 0,
    }));
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
