import { CodeReviewEngine, CodeReviewStatus } from '@prisma/client';
import { ReviewFinding } from './code-review-result';

export interface SubmissionReviewView {
  id: string;
  submissionId: string;
  userId: string;
  status: CodeReviewStatus;
  engine: CodeReviewEngine | null;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  summary: string | null;
  findings: ReviewFinding[];
  failureReason: string | null;
  createdAt: Date;
  completedAt: Date | null;
}
