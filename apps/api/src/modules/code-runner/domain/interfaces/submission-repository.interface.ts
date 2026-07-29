import { AssessmentLanguage, SubmissionStatus } from '@prisma/client';
import { Submission } from '../entities/submission';
import { SubmissionListPage } from '../read-models/submission-summary-view';

export interface SubmissionListFilter {
  problemId?: string;
  status?: SubmissionStatus;
  language?: AssessmentLanguage;
  page: number;
  pageSize: number;
}

export abstract class ISubmissionRepository {
  abstract save(submission: Submission): Promise<Submission>;
  abstract update(submission: Submission): Promise<Submission>;
  abstract findById(id: string): Promise<Submission | null>;
  abstract findForUser(userId: string, filter: SubmissionListFilter): Promise<SubmissionListPage>;
}
