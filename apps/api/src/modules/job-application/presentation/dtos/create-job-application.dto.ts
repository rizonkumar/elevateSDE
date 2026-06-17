import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { JobApplicationStatus } from '@prisma/client';

export class CreateJobApplicationDto {
  @ApiProperty({ example: 'Stripe' })
  @IsString()
  company!: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  role!: string;

  @ApiPropertyOptional({ enum: JobApplicationStatus, default: JobApplicationStatus.APPLIED })
  @IsEnum(JobApplicationStatus)
  @IsOptional()
  status?: JobApplicationStatus;

  @ApiPropertyOptional({ example: '$180k - $220k', nullable: true })
  @IsString()
  @IsOptional()
  salaryRange?: string;

  @ApiPropertyOptional({ example: 'https://jobs.example.com/posting/123', nullable: true })
  @IsUrl({ require_tld: false })
  @IsOptional()
  jobDescriptionUrl?: string;

  @ApiPropertyOptional({ example: '2026-07-01T14:00:00.000Z', nullable: true })
  @IsDateString()
  @IsOptional()
  interviewDate?: string;
}
