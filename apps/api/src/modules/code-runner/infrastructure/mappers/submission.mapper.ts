import {
  Submission as PrismaSubmission,
  SubmissionResult as PrismaSubmissionResult,
} from '@prisma/client';
import { Submission } from '../../domain/entities/submission';
import { SubmissionResult } from '../../domain/entities/submission-result';

type PrismaSubmissionWithResults = PrismaSubmission & { results: PrismaSubmissionResult[] };

export class SubmissionMapper {
  static toDomain(record: PrismaSubmissionWithResults): Submission {
    return Submission.reconstitute({
      id: record.id,
      userId: record.userId,
      problemId: record.problemId,
      language: record.language,
      sourceCode: record.sourceCode,
      status: record.status,
      passedCount: record.passedCount,
      totalCount: record.totalCount,
      totalRuntimeMs: record.totalRuntimeMs,
      peakMemoryKb: record.peakMemoryKb,
      stdout: record.stdout,
      createdAt: record.createdAt,
      results: record.results.map((result) =>
        SubmissionResult.reconstitute({
          id: result.id,
          testCaseId: result.testCaseId,
          label: result.label,
          status: result.status,
          actualOutput: result.actualOutput,
          runtimeMs: result.runtimeMs,
          memoryKb: result.memoryKb,
          isHidden: result.isHidden,
        }),
      ),
    });
  }
}
