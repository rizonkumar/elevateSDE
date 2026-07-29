import { Module } from '@nestjs/common';
import { ContestModule } from '../contest/contest.module';
import { OrganizationModule } from '../organization/organization.module';
import { ScoringModule } from '../scoring/scoring.module';
import { IScheduledTaskQueue } from './domain/interfaces/scheduled-task-queue.interface';
import { ScheduledTaskDispatcher } from './application/scheduled-task.dispatcher';
import { ScheduledTaskQueue } from './infrastructure/queues/scheduled-task.queue';
import { ScheduledTaskProcessor } from './infrastructure/processors/scheduled-task.processor';

@Module({
  imports: [ScoringModule, ContestModule, OrganizationModule],
  providers: [
    ScheduledTaskDispatcher,
    ScheduledTaskProcessor,
    {
      provide: IScheduledTaskQueue,
      useClass: ScheduledTaskQueue,
    },
  ],
})
export class SchedulerModule {}
