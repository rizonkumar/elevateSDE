import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum GoogleAuthContext {
  WEB = 'WEB',
  ADMIN = 'ADMIN',
}

export class GoogleSignInDto {
  @ApiProperty({ description: 'The Google Identity Services ID token from the client' })
  @IsString()
  idToken!: string;

  @ApiPropertyOptional({ enum: GoogleAuthContext, default: GoogleAuthContext.WEB })
  @IsEnum(GoogleAuthContext)
  @IsOptional()
  context?: GoogleAuthContext;
}
