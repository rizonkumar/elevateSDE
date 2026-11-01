import { Module } from '@nestjs/common';
import { ProblemModule } from '../problem/problem.module';
import { DailyChallengeModule } from '../daily-challenge/daily-challenge.module';
import { AchievementModule } from '../achievement/achievement.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { QueuesModule } from '../queues/queues.module';
import { ProblemAssistanceModule } from '../problem-assistance/problem-assistance.module';
import { ISandboxRunner } from './domain/interfaces/sandbox-runner.interface';
import { ISubmissionRepository } from './domain/interfaces/submission-repository.interface';
import { CodeRunnerService } from './application/code-runner.service';
import { SubmissionService } from './application/submission.service';
import { SubmissionInsightsService } from './application/submission-insights.service';
import { IDistributionCache } from './domain/interfaces/distribution-cache.interface';
import { InMemoryDistributionCache } from './infrastructure/cache/in-memory-distribution.cache';
import { DockerSandboxRunner } from './infrastructure/runners/docker-sandbox.runner';
import { WorkdirManager } from './infrastructure/runners/workdir.manager';
import { SubmissionRepository } from './infrastructure/repositories/submission.repository';
import { CodeExecutionProcessor } from './infrastructure/processors/code-execution.processor';
import { AssessmentsController } from './presentation/controllers/assessments.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  imports: [
    ProblemModule,
    QueuesModule,
    DailyChallengeModule,
    AchievementModule,
    LeaderboardModule,
    ProblemAssistanceModule,
  ],
  controllers: [AssessmentsController],
  providers: [
    CodeRunnerService,
    SubmissionService,
    SubmissionInsightsService,
    WorkdirManager,
    PrismaService,
    CodeExecutionProcessor,
    {
      provide: IDistributionCache,
      useClass: InMemoryDistributionCache,
    },
    {
      provide: ISandboxRunner,
      useClass: DockerSandboxRunner,
    },
    {
      provide: ISubmissionRepository,
      useClass: SubmissionRepository,
    },
  ],
  exports: [CodeRunnerService],
})
export class CodeRunnerModule {}
