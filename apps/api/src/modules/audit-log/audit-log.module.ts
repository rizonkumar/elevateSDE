import { Module } from '@nestjs/common';
import { IAuditLogRepository } from './domain/interfaces/audit-log-repository.interface';
import { AuditLogRepository } from './infrastructure/repositories/audit-log.repository';
import { AuditLogService } from './application/audit-log.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  providers: [
    AuditLogService,
    PrismaService,
    {
      provide: IAuditLogRepository,
      useClass: AuditLogRepository,
    },
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
