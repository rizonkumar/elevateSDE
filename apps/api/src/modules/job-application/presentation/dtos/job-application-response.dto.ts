import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobApplicationStatus } from '@prisma/client';
import { JobApplicationDto } from '@elevatesde/shared-types';

export class JobApplicationResponseDto implements JobApplicationDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'uuid-user-string' })
  userId!: string;

  @ApiProperty({ example: 'Stripe' })
  company!: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  role!: string;

  @ApiProperty({ enum: JobApplicationStatus })
  status!: JobApplicationStatus;

  @ApiPropertyOptional({ example: '$180k - $220k', nullable: true })
  salaryRange!: string | null;

  @ApiPropertyOptional({ example: 'https://jobs.example.com/posting/123', nullable: true })
  jobDescriptionUrl!: string | null;

  @ApiPropertyOptional({ example: '2026-07-01T14:00:00.000Z', nullable: true })
  interviewDate!: string | null;

  @ApiProperty({ example: 0 })
  boardPosition!: number;

  @ApiProperty({ example: '2026-06-15T08:11:29.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-15T08:11:29.000Z' })
  updatedAt!: string;
}
