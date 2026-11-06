import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileVisibility } from '@prisma/client';
import {
  HandleAvailabilityDto,
  HandleUnavailableReason,
  PublicProfileSettingsDto,
} from '@elevatesde/shared-types';

export class PublicProfileSettingsResponseDto implements PublicProfileSettingsDto {
  @ApiPropertyOptional({ example: 'ada-lovelace', nullable: true })
  handle!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiPropertyOptional({ nullable: true })
  githubUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  linkedinUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  websiteUrl!: string | null;

  @ApiProperty({ enum: ProfileVisibility })
  profileVisibility!: ProfileVisibility;

  @ApiProperty({ example: false })
  showOrganization!: boolean;

  @ApiPropertyOptional({ example: 'Acme Corp', nullable: true })
  organizationName!: string | null;

  @ApiProperty({ example: true })
  organizationAllowsPublicProfiles!: boolean;

  @ApiProperty({ example: true })
  isPublic!: boolean;
}

export class HandleAvailabilityResponseDto implements HandleAvailabilityDto {
  @ApiProperty({ example: 'ada-lovelace' })
  handle!: string;

  @ApiProperty({ example: true })
  available!: boolean;

  @ApiPropertyOptional({ enum: ['TAKEN', 'RESERVED', 'INVALID'], nullable: true })
  reason!: HandleUnavailableReason | null;
}
