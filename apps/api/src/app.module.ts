import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { FeatureFlagModule } from './modules/feature-flag/feature-flag.module';
import { AdminModule } from './modules/admin/admin.module';
import { JobApplicationModule } from './modules/job-application/job-application.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    AuditLogModule,
    FeatureFlagModule,
    AdminModule,
    JobApplicationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
