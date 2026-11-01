import { SubmissionReviewView } from '../review/submission-review-view';
import { CodeReviewOutcome } from './code-reviewer.interface';

export abstract class ICodeReviewRepository {
  abstract findBySubmission(submissionId: string): Promise<SubmissionReviewView | null>;
  abstract findById(id: string): Promise<SubmissionReviewView | null>;
  abstract createPending(submissionId: string, userId: string): Promise<SubmissionReviewView>;
  abstract complete(
    id: string,
    outcome: CodeReviewOutcome,
    completedAt: Date,
  ): Promise<SubmissionReviewView>;
  abstract fail(id: string, reason: string, completedAt: Date): Promise<void>;
  abstract countCreatedSince(userId: string, since: Date): Promise<number>;
}
