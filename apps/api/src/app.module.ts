import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
