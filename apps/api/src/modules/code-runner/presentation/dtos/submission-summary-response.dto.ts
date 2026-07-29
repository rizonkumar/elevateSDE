import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentDifficulty,
  AssessmentLanguage,
  SubmissionStatusValue,
  SubmissionSummaryDto,
} from '@elevatesde/shared-types';

export class SubmissionSummaryResponseDto implements SubmissionSummaryDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'uuid-problem' })
  problemId!: string;

  @ApiProperty({ example: 'Two Sum' })
  problemTitle!: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  problemDifficulty!: AssessmentDifficulty;

  @ApiProperty({ enum: ['javascript', 'python', 'cpp'] })
  language!: AssessmentLanguage;

  @ApiProperty({
    enum: ['ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'COMPILE_ERROR'],
  })
  status!: string;

  @ApiProperty({ example: 4 })
  passedCount!: number;

  @ApiProperty({ example: 4 })
  totalCount!: number;

  @ApiProperty({ example: 38.2 })
  totalRuntimeMs!: number;

  @ApiProperty({ example: 5120 })
  peakMemoryKb!: number;

  @ApiProperty({ example: '2026-06-20T08:11:29.000Z' })
  createdAt!: string;
}
