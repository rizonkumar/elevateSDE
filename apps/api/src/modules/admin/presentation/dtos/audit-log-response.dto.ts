import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ example: 'uuid-log-string' })
  id!: string;

  @ApiPropertyOptional({ example: 'uuid-user-string', nullable: true })
  userId!: string | null;

  @ApiProperty({ example: 'ROLE_CHANGED' })
  action!: string;

  @ApiPropertyOptional({ example: { oldRole: 'USER', newRole: 'ADMIN' }, nullable: true })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  createdAt!: string;
}
