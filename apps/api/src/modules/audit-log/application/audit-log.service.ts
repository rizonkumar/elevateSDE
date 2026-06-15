import { Injectable } from '@nestjs/common';
import { IAuditLogRepository } from '../domain/interfaces/audit-log-repository.interface';
import { AuditLog } from '../domain/entities/audit-log';
import { randomUUID } from 'crypto';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async create(
    userId: string | null,
    action: string,
    metadata?: Record<string, unknown>,
  ): Promise<AuditLog> {
    const id = randomUUID();
    const auditLog = AuditLog.create(id, userId, action, metadata || null);
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditLogRepository.findAll();
  }
}
