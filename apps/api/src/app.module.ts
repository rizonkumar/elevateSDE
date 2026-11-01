import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { RateLimitGuard } from './infrastructure/security/rate-limit.guard';
import { GLOBAL_RATE_LIMIT } from './infrastructure/security/rate-limits';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { FeatureFlagModule } from './modules/feature-flag/feature-flag.module';
import { AdminModule } from './modules/admin/admin.module';
import { JobApplicationModule } from './modules/job-application/job-application.module';
import { ProblemModule } from './modules/problem/problem.module';
import { CodeRunnerModule } from './modules/code-runner/code-runner.module';
import { ForumModule } from './modules/forum/forum.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { QueuesModule } from './modules/queues/queues.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { DailyChallengeModule } from './modules/daily-challenge/daily-challenge.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProblemSocialModule } from './modules/problem-social/problem-social.module';
import { ProblemAssistanceModule } from './modules/problem-assistance/problem-assistance.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { ReviewModule } from './modules/review/review.module';
import { ContestModule } from './modules/contest/contest.module';
import { LearningPathModule } from './modules/learning-path/learning-path.module';
import { ResumeModule } from './modules/resume/resume.module';
import { InterviewPreparationModule } from './modules/interview-preparation/interview-preparation.module';
import { MockInterviewModule } from './modules/mock-interview/mock-interview.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ...GLOBAL_RATE_LIMIT }] }),
    QueuesModule,
    AuthModule,
    UsersModule,
    AuditLogModule,
    FeatureFlagModule,
    AdminModule,
    JobApplicationModule,
    ProblemModule,
    CodeRunnerModule,
    ForumModule,
    LeaderboardModule,
    DashboardModule,
    OrganizationModule,
    DailyChallengeModule,
    AchievementModule,
    NotificationModule,
    ProblemSocialModule,
    ProblemAssistanceModule,
    TaxonomyModule,
    ReviewModule,
    ContestModule,
    LearningPathModule,
    ResumeModule,
    InterviewPreparationModule,
    MockInterviewModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
