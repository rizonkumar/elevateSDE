import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, UserRole } from '@prisma/client';
import { AccountStatusDto, UserDto } from '@elevatesde/shared-types';

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

  @ApiPropertyOptional({ example: '3 YOE in Full Stack Development.', nullable: true })
  headline!: string | null;

  @ApiProperty({ enum: UserRole })
  role!: string;

  @ApiProperty({ enum: AccountStatus })
  status!: AccountStatusDto;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  createdAt!: string;
}
