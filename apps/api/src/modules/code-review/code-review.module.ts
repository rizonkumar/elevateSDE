import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CodeRunnerModule } from '../code-runner/code-runner.module';
import { ProblemModule } from '../problem/problem.module';
import { ProblemAssistanceModule } from '../problem-assistance/problem-assistance.module';
import { FeatureFlagModule } from '../feature-flag/feature-flag.module';
import { CodeReviewService } from './application/code-review.service';
import { ICodeReviewRepository } from './domain/interfaces/code-review-repository.interface';
import { ICodeReviewer } from './domain/interfaces/code-reviewer.interface';
import { CodeReviewRepository } from './infrastructure/repositories/code-review.repository';
import { DeterministicCodeReviewer } from './infrastructure/reviewers/deterministic-code-reviewer';
import { OpenAiCompatibleCodeReviewer } from './infrastructure/reviewers/openai-compatible-code-reviewer';
import { ResilientCodeReviewer } from './infrastructure/reviewers/resilient-code-reviewer';
import { CodeReviewProcessor } from './infrastructure/processors/code-review.processor';
import { CodeReviewController } from './presentation/controllers/code-review.controller';

@Module({
  imports: [CodeRunnerModule, ProblemModule, ProblemAssistanceModule, FeatureFlagModule],
  controllers: [CodeReviewController],
  providers: [
    CodeReviewService,
    CodeReviewProcessor,
    DeterministicCodeReviewer,
    OpenAiCompatibleCodeReviewer,
    PrismaService,
    { provide: ICodeReviewer, useClass: ResilientCodeReviewer },
    { provide: ICodeReviewRepository, useClass: CodeReviewRepository },
  ],
})
export class CodeReviewModule {}
