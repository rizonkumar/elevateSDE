import { SubmissionStatus, TestCaseResultStatus } from '@prisma/client';

export interface CaseOutcome {
  testCaseId: string;
  label: string;
  status: TestCaseResultStatus;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isHidden: boolean;
  runtimeMs: number;
  memoryKb: number;
}

export interface AssessmentRunOutcome {
  status: SubmissionStatus;
  results: CaseOutcome[];
  passedCount: number;
  totalCount: number;
  totalRuntimeMs: number;
  peakMemoryKb: number;
  stdout: string;
}
