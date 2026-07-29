import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateProfileDto as UpdateProfileDtoShape } from '@elevatesde/shared-types';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { HANDLE_PATTERN } from '../../domain/entities/user';

export class UpdateProfileDto implements UpdateProfileDtoShape {
  @ApiPropertyOptional({ example: 'ada-lovelace' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(HANDLE_PATTERN, {
    message:
      'Handle must be 3-30 characters of lowercase letters, numbers and single hyphens, with no leading, trailing or double hyphen',
  })
  handle?: string;

  @ApiPropertyOptional({ example: 'Ada' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Lovelace' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @ApiPropertyOptional({ example: '3 YOE in Full Stack Development.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string;

  @ApiPropertyOptional({ example: 'Building things that solve real problems.' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://github.com/ada' })
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/ada' })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: 'https://ada.dev' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isProfilePublic?: boolean;
}
