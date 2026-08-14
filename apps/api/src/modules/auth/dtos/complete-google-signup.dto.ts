import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CompleteGoogleSignupDto {
  @ApiProperty({ description: 'The onboarding token returned by POST /auth/google' })
  @IsString()
  onboardingToken!: string;

  @ApiProperty({ enum: [UserRole.USER, UserRole.TENANT_ADMIN] })
  @IsIn([UserRole.USER, UserRole.TENANT_ADMIN])
  role!: typeof UserRole.USER | typeof UserRole.TENANT_ADMIN;

  @ApiPropertyOptional({ example: 'Elevate B2B Inc.' })
  @IsString()
  @IsOptional()
  companyName?: string;
}
