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

  async record(
    userId: string,
    problemId: string,
    language: ProblemLanguage,
    code: string,
    outcome: AssessmentRunOutcome,
  ): Promise<Submission> {
    const results = outcome.results.map((result) =>
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
    );
    const submission = Submission.create({
      id: randomUUID(),
      userId,
      problemId,
      language: toPrismaLanguage[language],
      sourceCode: code,
      status: outcome.status,
      passedCount: outcome.passedCount,
      totalCount: outcome.totalCount,
      totalRuntimeMs: outcome.totalRuntimeMs,
      peakMemoryKb: outcome.peakMemoryKb,
      stdout: outcome.stdout,
      results,
      createdAt: new Date(),
    });
    return this.submissionRepository.save(submission);
  }

  async listForUserProblem(userId: string, problemId: string): Promise<Submission[]> {
    return this.submissionRepository.findByUserAndProblem(userId, problemId);
  }
}
