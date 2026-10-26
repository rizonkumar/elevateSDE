import type {
  InterviewCompetencyScore,
  InterviewConfig,
  MockInterviewDimensionScores,
  MockInterviewEngine,
} from '@elevatesde/shared-types';

export interface MockInterviewExchange {
  question: string;
  answer: string;
}

export interface MockInterviewEvaluationRequest {
  config: InterviewConfig;
  history: readonly MockInterviewExchange[];
  question: string;
  answer: string;
  askFollowUp: boolean;
}

export interface MockInterviewEvaluation {
  dimensionScores: MockInterviewDimensionScores;
  feedback: string;
  nextQuestion: string | null;
}

export interface MockInterviewSummaryRequest {
  config: InterviewConfig;
  exchanges: ReadonlyArray<MockInterviewExchange & { score: number; feedback: string }>;
  competencies: readonly InterviewCompetencyScore[];
  overallScore: number;
}

export interface MockInterviewNarrative {
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface MockInterviewerPort {
  openingQuestion(config: InterviewConfig): Promise<string>;
  evaluate(request: MockInterviewEvaluationRequest): Promise<MockInterviewEvaluation>;
  summarize(request: MockInterviewSummaryRequest): Promise<MockInterviewNarrative>;
}

export interface InterviewerResult<T> {
  value: T;
  engine: MockInterviewEngine;
}

export abstract class IMockInterviewer {
  abstract preferredEngine(): MockInterviewEngine;
  abstract openingQuestion(config: InterviewConfig): Promise<InterviewerResult<string>>;
  abstract evaluate(
    request: MockInterviewEvaluationRequest,
  ): Promise<InterviewerResult<MockInterviewEvaluation>>;
  abstract summarize(
    request: MockInterviewSummaryRequest,
  ): Promise<InterviewerResult<MockInterviewNarrative>>;
  abstract summarizeDeterministically(request: MockInterviewSummaryRequest): MockInterviewNarrative;
}
