import { CodeReviewEngine } from '@prisma/client';
import { ProblemLanguage } from '../../../problem/domain/entities/problem';
import { CodeReviewResult } from '../review/code-review-result';

export type ReviewableVerdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR';

export interface FailingVisibleCase {
  label: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
}

export interface CodeReviewRequest {
  language: ProblemLanguage;
  functionName: string;
  problemTitle: string;
  problemDescription: string;
  constraints: string[];
  code: string;
  verdict: ReviewableVerdict;
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  failingVisibleCases: FailingVisibleCase[];
  hiddenCasesFailed: number;
}

export interface CodeReviewOutcome {
  engine: CodeReviewEngine;
  result: CodeReviewResult;
}

export abstract class ICodeReviewer {
  abstract review(request: CodeReviewRequest): Promise<CodeReviewOutcome>;
}
