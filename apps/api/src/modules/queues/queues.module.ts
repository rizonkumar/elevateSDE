import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_PREFIX } from './domain/queue-names';
import { ICodeExecutionQueue } from './domain/interfaces/code-execution-queue.interface';
import { CodeExecutionQueue } from './application/code-execution.queue';
import { IResumeAnalysisQueue } from './domain/interfaces/resume-analysis-queue.interface';
import { ResumeAnalysisQueue } from './application/resume-analysis.queue';
import { IScheduledJobQueue } from './domain/interfaces/scheduled-job-queue.interface';
import { ScheduledJobQueue } from './application/scheduled-job.queue';
import { buildRedisConnection } from './infrastructure/redis-connection';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({ connection: buildRedisConnection(), prefix: QUEUE_PREFIX }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.CODE_EXECUTION },
      { name: QUEUE_NAMES.RESUME },
      { name: QUEUE_NAMES.SCHEDULED },
    ),
  ],
  providers: [
    { provide: ICodeExecutionQueue, useClass: CodeExecutionQueue },
    { provide: IResumeAnalysisQueue, useClass: ResumeAnalysisQueue },
    { provide: IScheduledJobQueue, useClass: ScheduledJobQueue },
  ],
  exports: [ICodeExecutionQueue, IResumeAnalysisQueue, IScheduledJobQueue, BullModule],
})
export class QueuesModule {}
