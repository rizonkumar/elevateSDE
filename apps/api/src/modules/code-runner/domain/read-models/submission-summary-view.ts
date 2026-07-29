import { AssessmentDifficulty, AssessmentLanguage, SubmissionStatus } from '@prisma/client';

export interface SubmissionSummaryView {
  id: string;
  problemId: string;
  problemTitle: string;
  problemDifficulty: AssessmentDifficulty;
  language: AssessmentLanguage;
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  totalRuntimeMs: number;
  peakMemoryKb: number;
  createdAt: Date;
}

export interface SubmissionListPage {
  items: SubmissionSummaryView[];
  total: number;
}
