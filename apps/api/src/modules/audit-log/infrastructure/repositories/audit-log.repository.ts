import { Injectable } from '@nestjs/common';
import { IAuditLogRepository } from '../../domain/interfaces/audit-log-repository.interface';
import { AuditLog } from '../../domain/entities/audit-log';
import { AuditLogMapper } from '../mappers/audit-log.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(auditLog: AuditLog): Promise<AuditLog> {
    const data = AuditLogMapper.toPersistence(auditLog);
    const prismaAuditLog = await this.prisma.auditLog.create({
      data: {
        id: data.id,
        userId: data.userId,
        action: data.action,
        metadata: data.metadata || undefined,
      },
    });
    return AuditLogMapper.toDomain(prismaAuditLog);
  }

  async findAll(): Promise<AuditLog[]> {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
    return logs.map((log) => AuditLogMapper.toDomain(log));
  }
}
