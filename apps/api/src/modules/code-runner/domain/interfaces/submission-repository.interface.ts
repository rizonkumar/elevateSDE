import { AssessmentLanguage } from '@prisma/client';
import { Submission } from '../entities/submission';
import { BestRun } from '../insights/performance-insights';

export interface SubmissionPage {
  items: Submission[];
  nextCursor: string | null;
}

export abstract class ISubmissionRepository {
  abstract save(submission: Submission): Promise<Submission>;
  abstract update(submission: Submission): Promise<Submission>;
  abstract findById(id: string): Promise<Submission | null>;
  abstract findPageByUserAndProblem(
    userId: string,
    problemId: string,
    limit: number,
    cursor: string | null,
  ): Promise<SubmissionPage>;
  abstract findBestAcceptedRuns(
    problemId: string,
    language: AssessmentLanguage,
    excludeUserId: string | null,
  ): Promise<BestRun[]>;
}
