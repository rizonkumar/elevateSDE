import { Module } from '@nestjs/common';
import { ProblemModule } from '../problem/problem.module';
import { ISandboxRunner } from './domain/interfaces/sandbox-runner.interface';
import { ISubmissionRepository } from './domain/interfaces/submission-repository.interface';
import { CodeRunnerService } from './application/code-runner.service';
import { SubmissionService } from './application/submission.service';
import { DockerSandboxRunner } from './infrastructure/runners/docker-sandbox.runner';
import { WorkdirManager } from './infrastructure/runners/workdir.manager';
import { SubmissionRepository } from './infrastructure/repositories/submission.repository';
import { AssessmentsController } from './presentation/controllers/assessments.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  imports: [ProblemModule],
  controllers: [AssessmentsController],
  providers: [
    CodeRunnerService,
    SubmissionService,
    WorkdirManager,
    PrismaService,
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
