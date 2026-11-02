import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ISubmissionRepository,
  SubmissionPage,
} from '../domain/interfaces/submission-repository.interface';
import { Submission } from '../domain/entities/submission';
import { SubmissionResult } from '../domain/entities/submission-result';
import { ProblemLanguage } from '../../problem/domain/entities/problem';
import { AssessmentRunOutcome } from './assessment-outcome';
import { toPrismaLanguage } from './language';
import { PerformancePercentiles } from '../domain/insights/performance-insights';

const NO_PERCENTILES: PerformancePercentiles = { runtime: null, memory: null };

@Injectable()
export class SubmissionService {
  constructor(private readonly submissionRepository: ISubmissionRepository) {}

  async createPending(
    userId: string,
    problemId: string,
    language: ProblemLanguage,
    code: string,
  ): Promise<Submission> {
    const submission = Submission.createQueued({
      id: randomUUID(),
      userId,
      problemId,
      language: toPrismaLanguage[language],
      sourceCode: code,
      createdAt: new Date(),
    });
    return this.submissionRepository.save(submission);
  }

  async markRunning(submissionId: string): Promise<void> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) return;
    submission.markRunning();
    await this.submissionRepository.update(submission);
  }

  async applyResult(
    submissionId: string,
    outcome: AssessmentRunOutcome,
    percentiles: PerformancePercentiles = NO_PERCENTILES,
  ): Promise<void> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) return;
    submission.applyOutcome({
      status: outcome.status,
      passedCount: outcome.passedCount,
      totalCount: outcome.totalCount,
      totalRuntimeMs: outcome.totalRuntimeMs,
      peakMemoryKb: outcome.peakMemoryKb,
      stdout: outcome.stdout,
      runtimePercentile: percentiles.runtime,
      memoryPercentile: percentiles.memory,
      results: outcome.results.map((result) =>
        SubmissionResult.create({
          id: randomUUID(),
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
    await this.submissionRepository.update(submission);
  }

  async markFailed(submissionId: string, message: string): Promise<void> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) return;
    submission.markFailed(message);
    await this.submissionRepository.update(submission);
  }

  async getForUser(submissionId: string, userId: string): Promise<Submission | null> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission || submission.getUserId() !== userId) return null;
    return submission;
  }

  async listPageForUserProblem(
    userId: string,
    problemId: string,
    limit: number,
    cursor: string | null,
  ): Promise<SubmissionPage> {
    if (cursor) {
      const anchor = await this.getForUser(cursor, userId);
      if (!anchor || anchor.getProblemId() !== problemId) {
        return { items: [], nextCursor: null };
      }
    }
    return this.submissionRepository.findPageByUserAndProblem(userId, problemId, limit, cursor);
  }
}
