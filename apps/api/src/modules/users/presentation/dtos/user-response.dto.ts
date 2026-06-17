import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UserDto } from '@elevatesde/shared-types';

export class UserResponseDto implements UserDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'candidate@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'uuid-tenant-string', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ example: 'Ada', nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ example: 'Lovelace', nullable: true })
  lastName!: string | null;

  @ApiProperty({ enum: UserRole })
  role!: string;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  createdAt!: string;
}
