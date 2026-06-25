import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ISubmissionRepository } from '../domain/interfaces/submission-repository.interface';
import { Submission } from '../domain/entities/submission';
import { SubmissionResult } from '../domain/entities/submission-result';
import { ProblemLanguage } from '../../problem/domain/entities/problem';
import { AssessmentRunOutcome } from './assessment-outcome';
import { toPrismaLanguage } from './language';

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

  async applyResult(submissionId: string, outcome: AssessmentRunOutcome): Promise<void> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) return;
    submission.applyOutcome({
      status: outcome.status,
      passedCount: outcome.passedCount,
      totalCount: outcome.totalCount,
      totalRuntimeMs: outcome.totalRuntimeMs,
      peakMemoryKb: outcome.peakMemoryKb,
      stdout: outcome.stdout,
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

  async listForUserProblem(userId: string, problemId: string): Promise<Submission[]> {
    return this.submissionRepository.findByUserAndProblem(userId, problemId);
  }
}
