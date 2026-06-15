import { AuditLog } from '../entities/audit-log';

export abstract class IAuditLogRepository {
  abstract save(auditLog: AuditLog): Promise<AuditLog>;
  abstract findAll(): Promise<AuditLog[]>;
}
