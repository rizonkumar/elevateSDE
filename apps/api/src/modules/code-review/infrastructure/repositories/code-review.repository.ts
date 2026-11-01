import { Injectable } from '@nestjs/common';
import { CodeReviewStatus, Prisma, SubmissionReview } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ICodeReviewRepository } from '../../domain/interfaces/code-review-repository.interface';
import { CodeReviewOutcome } from '../../domain/interfaces/code-reviewer.interface';
import {
  ReviewFinding,
  isFindingCategory,
  isFindingSeverity,
} from '../../domain/review/code-review-result';
import { SubmissionReviewView } from '../../domain/review/submission-review-view';

function toFindings(value: Prisma.JsonValue | null): ReviewFinding[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const { category, severity, line, message, suggestion } = item;
    if (!isFindingCategory(category) || !isFindingSeverity(severity)) return [];
    if (typeof message !== 'string') return [];
    return [
      {
        category,
        severity,
        line: typeof line === 'number' ? line : null,
        message,
        suggestion: typeof suggestion === 'string' ? suggestion : null,
      },
    ];
  });
}

function toView(record: SubmissionReview): SubmissionReviewView {
  return {
    id: record.id,
    submissionId: record.submissionId,
    userId: record.userId,
    status: record.status,
    engine: record.engine,
    timeComplexity: record.timeComplexity,
    spaceComplexity: record.spaceComplexity,
    summary: record.summary,
    findings: toFindings(record.findings),
    failureReason: record.failureReason,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
  };
}

@Injectable()
export class CodeReviewRepository implements ICodeReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySubmission(submissionId: string): Promise<SubmissionReviewView | null> {
    const record = await this.prisma.submissionReview.findUnique({ where: { submissionId } });
    return record ? toView(record) : null;
  }

  async findById(id: string): Promise<SubmissionReviewView | null> {
    const record = await this.prisma.submissionReview.findUnique({ where: { id } });
    return record ? toView(record) : null;
  }

  async createPending(submissionId: string, userId: string): Promise<SubmissionReviewView> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    const record = await this.prisma.submissionReview.upsert({
      where: { submissionId },
      create: { submissionId, userId, tenantId: user?.tenantId ?? null },
      update: {},
    });
    return toView(record);
  }

  async complete(
    id: string,
    outcome: CodeReviewOutcome,
    completedAt: Date,
  ): Promise<SubmissionReviewView> {
    const record = await this.prisma.submissionReview.update({
      where: { id },
      data: {
        status: CodeReviewStatus.COMPLETED,
        engine: outcome.engine,
        timeComplexity: outcome.result.timeComplexity,
        spaceComplexity: outcome.result.spaceComplexity,
        summary: outcome.result.summary,
        findings: outcome.result.findings.map((finding) => ({ ...finding })),
        failureReason: null,
        completedAt,
      },
    });
    return toView(record);
  }

  async fail(id: string, reason: string, completedAt: Date): Promise<void> {
    await this.prisma.submissionReview.updateMany({
      where: { id, status: CodeReviewStatus.PENDING },
      data: { status: CodeReviewStatus.FAILED, failureReason: reason, completedAt },
    });
  }

  async countCreatedSince(userId: string, since: Date): Promise<number> {
    return this.prisma.submissionReview.count({ where: { userId, createdAt: { gte: since } } });
  }
}
