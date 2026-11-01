import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { PASSWORD_POLICY } from '@elevatesde/shared-types';

export class RegisterDto {
  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'correct-horse-42' })
  @IsString()
  @MinLength(PASSWORD_POLICY.minLength)
  @MaxLength(PASSWORD_POLICY.maxLength)
  @Matches(PASSWORD_POLICY.letterPattern, { message: 'password must contain at least one letter' })
  @Matches(PASSWORD_POLICY.digitPattern, { message: 'password must contain at least one number' })
  password!: string;

  @ApiPropertyOptional({ example: 'Ada' })
  @IsString()
  @MaxLength(80)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Lovelace' })
  @IsString()
  @MaxLength(80)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Elevate B2B Inc.' })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  companyName?: string;
}
