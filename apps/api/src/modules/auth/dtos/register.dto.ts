import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 72;

export class RegisterDto {
  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'correct-horse-42' })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(MAX_PASSWORD_LENGTH)
  @Matches(/[A-Za-z]/, { message: 'password must contain at least one letter' })
  @Matches(/\d/, { message: 'password must contain at least one number' })
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
