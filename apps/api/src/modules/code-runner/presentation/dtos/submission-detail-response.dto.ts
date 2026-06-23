import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentLanguage,
  SubmissionDetailDto,
  SubmissionStatusValue,
} from '@elevatesde/shared-types';
import { TestCaseResultResponseDto } from './test-case-result-response.dto';

const SUBMISSION_STATUSES: SubmissionStatusValue[] = [
  'QUEUED',
  'RUNNING',
  'ACCEPTED',
  'WRONG_ANSWER',
  'RUNTIME_ERROR',
  'TIME_LIMIT_EXCEEDED',
  'COMPILE_ERROR',
];

export class SubmissionDetailResponseDto implements SubmissionDetailDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'uuid-problem' })
  problemId!: string;

  @ApiProperty({ enum: ['javascript', 'python', 'cpp'] })
  language!: AssessmentLanguage;

  @ApiProperty({ enum: SUBMISSION_STATUSES, example: 'RUNNING' })
  status!: SubmissionStatusValue;

  @ApiProperty({ example: 4 })
  passedCount!: number;

  @ApiProperty({ example: 4 })
  totalCount!: number;

  @ApiProperty({ example: 38.2 })
  totalRuntimeMs!: number;

  @ApiProperty({ example: 5120 })
  peakMemoryKb!: number;

  @ApiProperty({ example: 'Executed 4 test case(s).' })
  stdout!: string;

  @ApiProperty({ type: [TestCaseResultResponseDto] })
  results!: TestCaseResultResponseDto[];

  @ApiProperty({ example: '2026-06-20T08:11:29.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-20T08:11:34.000Z' })
  updatedAt!: string;
}
