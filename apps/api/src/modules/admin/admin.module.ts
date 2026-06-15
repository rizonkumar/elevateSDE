import { Module } from '@nestjs/common';
import { AdminController } from './presentation/controllers/admin.controller';
import { UsersModule } from '../users/users.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FeatureFlagModule } from '../feature-flag/feature-flag.module';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  imports: [UsersModule, AuditLogModule, FeatureFlagModule],
  controllers: [AdminController],
  providers: [PrismaService],
})
export class AdminModule {}
