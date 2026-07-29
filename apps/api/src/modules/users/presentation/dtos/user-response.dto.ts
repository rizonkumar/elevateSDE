import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UserDto } from '@elevatesde/shared-types';

export class UserResponseDto implements UserDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'candidate@example.com' })
  email!: string;

  @ApiProperty({ example: 'ada-lovelace' })
  handle!: string;

  @ApiPropertyOptional({ example: 'uuid-tenant-string', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ example: 'Ada', nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ example: 'Lovelace', nullable: true })
  lastName!: string | null;

  @ApiPropertyOptional({ example: '3 YOE in Full Stack Development.', nullable: true })
  headline!: string | null;

  @ApiPropertyOptional({ example: 'Building things that solve real problems.', nullable: true })
  bio!: string | null;

  @ApiProperty({ example: true })
  isProfilePublic!: boolean;

  @ApiPropertyOptional({ example: 'https://github.com/ada', nullable: true })
  githubUrl!: string | null;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/ada', nullable: true })
  linkedinUrl!: string | null;

  @ApiPropertyOptional({ example: 'https://ada.dev', nullable: true })
  websiteUrl!: string | null;

  @ApiProperty({ enum: UserRole })
  role!: string;

  @ApiProperty({ example: '2026-06-15T08:11:29Z' })
  createdAt!: string;
}
