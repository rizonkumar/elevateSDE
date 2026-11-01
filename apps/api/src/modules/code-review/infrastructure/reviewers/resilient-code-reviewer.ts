import { Injectable, Logger } from '@nestjs/common';
import { CodeReviewEngine } from '@prisma/client';
import {
  CodeReviewOutcome,
  CodeReviewRequest,
  ICodeReviewer,
} from '../../domain/interfaces/code-reviewer.interface';
import { DeterministicCodeReviewer } from './deterministic-code-reviewer';
import {
  OpenAiCompatibleCodeReviewer,
  isCodeReviewAiEnabled,
} from './openai-compatible-code-reviewer';

@Injectable()
export class ResilientCodeReviewer implements ICodeReviewer {
  private readonly logger = new Logger(ResilientCodeReviewer.name);

  constructor(
    private readonly llm: OpenAiCompatibleCodeReviewer,
    private readonly fallback: DeterministicCodeReviewer,
  ) {}

  async review(request: CodeReviewRequest): Promise<CodeReviewOutcome> {
    if (isCodeReviewAiEnabled() && this.llm.isConfigured()) {
      try {
        return { engine: CodeReviewEngine.LLM, result: await this.llm.review(request) };
      } catch (error) {
        this.logger.warn(
          `AI code review failed, using the automated review instead: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
    return { engine: CodeReviewEngine.DETERMINISTIC, result: this.fallback.review(request) };
  }
}
