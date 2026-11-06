import { SubmissionStatus } from '@prisma/client';

export const SUBMISSION_EVENTS = {
  JUDGED: 'submission.judged',
} as const;

export interface SubmissionJudgedEvent {
  submissionId: string;
  userId: string;
  problemId: string;
  status: SubmissionStatus;
  judgedAt: Date;
}
