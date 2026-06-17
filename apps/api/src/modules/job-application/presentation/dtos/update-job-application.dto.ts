import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { JobApplicationStatus } from '@prisma/client';

export class UpdateJobApplicationDto {
  @ApiPropertyOptional({ example: 'Stripe' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ example: 'Staff Software Engineer' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ enum: JobApplicationStatus })
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

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  boardPosition?: number;
}
