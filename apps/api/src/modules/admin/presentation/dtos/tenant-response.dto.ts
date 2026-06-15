import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantResponseDto {
  @ApiProperty({ example: 'uuid-tenant-string' })
  id!: string;

  @ApiProperty({ example: 'Acme Corp' })
  name!: string;

  @ApiPropertyOptional({ example: 'cus_12345', nullable: true })
  stripeCustomerId!: string | null;

  @ApiProperty({ example: 'FREE' })
  subscriptionPlan!: string;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  updatedAt!: string;
}
