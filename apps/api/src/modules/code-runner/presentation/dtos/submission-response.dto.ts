import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentLanguage,
  SubmissionStatusValue,
  SubmissionSummaryDto,
} from '@elevatesde/shared-types';

export class SubmissionResponseDto implements SubmissionSummaryDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'uuid-problem' })
  problemId!: string;

  @ApiProperty({ enum: ['javascript', 'python', 'cpp', 'java', 'go'] })
  language!: AssessmentLanguage;

  @ApiProperty({
    enum: [
      'QUEUED',
      'RUNNING',
      'ACCEPTED',
      'WRONG_ANSWER',
      'RUNTIME_ERROR',
      'TIME_LIMIT_EXCEEDED',
      'COMPILE_ERROR',
    ],
  })
  status!: SubmissionStatusValue;

  @ApiProperty({ example: 4 })
  passedCount!: number;

  @ApiProperty({ example: 4 })
  totalCount!: number;

  @ApiProperty({ example: 38.2 })
  totalRuntimeMs!: number;

  @ApiProperty({ example: 5120 })
  peakMemoryKb!: number;

  @ApiProperty({ example: 72.5, nullable: true })
  runtimePercentile!: number | null;

  @ApiProperty({ example: 41, nullable: true })
  memoryPercentile!: number | null;

  @ApiProperty({ example: '2026-06-20T08:11:29.000Z' })
  createdAt!: string;
}
