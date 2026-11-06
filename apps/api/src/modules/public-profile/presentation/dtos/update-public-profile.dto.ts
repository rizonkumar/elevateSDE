import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileVisibility } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { UpdatePublicProfileRequest } from '@elevatesde/shared-types';
import { HANDLE_MAX_LENGTH } from '../../domain/policies/handle-policy';
import { PROFILE_LINK_MAX_LENGTH } from '../../domain/policies/profile-link-policy';
import { BIO_MAX_LENGTH, LOCATION_MAX_LENGTH } from '../../domain/policies/profile-text-limits';

export class UpdatePublicProfileDto implements UpdatePublicProfileRequest {
  @ApiPropertyOptional({ example: 'ada-lovelace', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(HANDLE_MAX_LENGTH + 10)
  handle?: string | null;

  @ApiPropertyOptional({
    example: 'Backend engineer preparing for staff interviews.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(BIO_MAX_LENGTH + 50)
  bio?: string | null;

  @ApiPropertyOptional({ example: 'Berlin, Germany', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(LOCATION_MAX_LENGTH + 20)
  location?: string | null;

  @ApiPropertyOptional({ example: 'https://github.com/ada', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(PROFILE_LINK_MAX_LENGTH + 20)
  githubUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/ada', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(PROFILE_LINK_MAX_LENGTH + 20)
  linkedinUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://ada.dev', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(PROFILE_LINK_MAX_LENGTH + 20)
  websiteUrl?: string | null;

  @ApiPropertyOptional({ enum: ProfileVisibility })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  showOrganization?: boolean;
}
