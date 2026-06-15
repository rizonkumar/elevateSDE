import { AuditLog } from '../../domain/entities/audit-log';
import { AuditLog as PrismaAuditLog, Prisma } from '@prisma/client';

export class AuditLogMapper {
  static toDomain(prismaAuditLog: PrismaAuditLog): AuditLog {
    return AuditLog.reconstitute(
      prismaAuditLog.id,
      prismaAuditLog.userId,
      prismaAuditLog.action,
      prismaAuditLog.metadata as Record<string, unknown> | null,
      prismaAuditLog.createdAt,
    );
  }

  static toPersistence(auditLog: AuditLog): Omit<PrismaAuditLog, 'createdAt'> {
    return {
      id: auditLog.getId(),
      userId: auditLog.getUserId(),
      action: auditLog.getAction(),
      metadata: (auditLog.getMetadata() as Prisma.JsonValue) || null,
    };
  }
}
