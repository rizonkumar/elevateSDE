import { Module } from '@nestjs/common';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { DailyChallengeModule } from '../daily-challenge/daily-challenge.module';
import { ContestModule } from '../contest/contest.module';
import { InterviewPreparationModule } from '../interview-preparation/interview-preparation.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SchedulerRegistrar } from './application/scheduler-registrar.service';
import { SchedulerService } from './application/scheduler.service';
import { ScheduledJobRunner } from './application/scheduled-job-runner.service';
import { ScheduledJobsProcessor } from './infrastructure/processors/scheduled-jobs.processor';
import { SchedulerManagementController } from './presentation/controllers/scheduler-management.controller';

@Module({
  imports: [
    LeaderboardModule,
    DailyChallengeModule,
    ContestModule,
    InterviewPreparationModule,
    AuditLogModule,
  ],
  controllers: [SchedulerManagementController],
  providers: [SchedulerRegistrar, SchedulerService, ScheduledJobRunner, ScheduledJobsProcessor],
})
export class SchedulerModule {}
