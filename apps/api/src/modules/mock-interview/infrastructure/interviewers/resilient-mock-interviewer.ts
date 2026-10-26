import { Injectable, Logger } from '@nestjs/common';
import type { InterviewConfig, MockInterviewEngine } from '@elevatesde/shared-types';
import {
  IMockInterviewer,
  InterviewerResult,
  MockInterviewEvaluation,
  MockInterviewEvaluationRequest,
  MockInterviewNarrative,
  MockInterviewSummaryRequest,
} from '../../domain/interfaces/mock-interviewer.interface';
import { DeterministicMockInterviewer } from './deterministic-mock-interviewer';
import { OpenAiCompatibleMockInterviewer } from './openai-compatible-mock-interviewer';

export function isMockInterviewAiEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.MOCK_INTERVIEW_AI_ENABLED?.trim().toLowerCase() === 'true';
}

@Injectable()
export class ResilientMockInterviewer implements IMockInterviewer {
  private readonly logger = new Logger(ResilientMockInterviewer.name);

  constructor(
    private readonly llm: OpenAiCompatibleMockInterviewer,
    private readonly fallback: DeterministicMockInterviewer,
  ) {}

  preferredEngine(): MockInterviewEngine {
    return isMockInterviewAiEnabled() && this.llm.isConfigured() ? 'LLM' : 'DETERMINISTIC';
  }

  openingQuestion(config: InterviewConfig): Promise<InterviewerResult<string>> {
    return this.run(
      'opening question',
      () => this.llm.openingQuestion(config),
      () => this.fallback.openingQuestion(config),
    );
  }

  evaluate(
    request: MockInterviewEvaluationRequest,
  ): Promise<InterviewerResult<MockInterviewEvaluation>> {
    return this.run(
      'answer evaluation',
      () => this.llm.evaluate(request),
      () => this.fallback.evaluate(request),
    );
  }

  summarize(
    request: MockInterviewSummaryRequest,
  ): Promise<InterviewerResult<MockInterviewNarrative>> {
    return this.run(
      'summary',
      () => this.llm.summarize(request),
      () => this.fallback.summarize(request),
    );
  }

  summarizeDeterministically(request: MockInterviewSummaryRequest): MockInterviewNarrative {
    return this.fallback.summarizeSync(request);
  }

  private async run<T>(
    label: string,
    primary: () => Promise<T>,
    secondary: () => Promise<T>,
  ): Promise<InterviewerResult<T>> {
    if (this.preferredEngine() === 'LLM') {
      try {
        return { value: await primary(), engine: 'LLM' };
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(`Falling back to deterministic ${label}: ${reason}`);
      }
    }
    return { value: await secondary(), engine: 'DETERMINISTIC' };
  }
}
