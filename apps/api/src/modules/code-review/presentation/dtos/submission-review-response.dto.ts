import { ApiProperty } from '@nestjs/swagger';
import {
  CodeReviewEngineValue,
  CodeReviewFindingCategory,
  CodeReviewFindingDto,
  CodeReviewFindingSeverity,
  CodeReviewQuotaDto,
  CodeReviewStatusValue,
  SubmissionReviewDto,
} from '@elevatesde/shared-types';
import { FINDING_CATEGORIES, FINDING_SEVERITIES } from '../../domain/review/code-review-result';

export class CodeReviewFindingResponseDto implements CodeReviewFindingDto {
  @ApiProperty({ enum: FINDING_CATEGORIES })
  category!: CodeReviewFindingCategory;

  @ApiProperty({ enum: FINDING_SEVERITIES })
  severity!: CodeReviewFindingSeverity;

  @ApiProperty({ example: 12, nullable: true })
  line!: number | null;

  @ApiProperty({ example: 'The inner loop rescans the array for every element.' })
  message!: string;

  @ApiProperty({ example: 'Store seen values in a hash map instead.', nullable: true })
  suggestion!: string | null;
}

export class SubmissionReviewResponseDto implements SubmissionReviewDto {
  @ApiProperty({ example: 'uuid-review' })
  id!: string;

  @ApiProperty({ example: 'uuid-submission' })
  submissionId!: string;

  @ApiProperty({ enum: ['PENDING', 'COMPLETED', 'FAILED'] })
  status!: CodeReviewStatusValue;

  @ApiProperty({ enum: ['LLM', 'DETERMINISTIC'], nullable: true })
  engine!: CodeReviewEngineValue | null;

  @ApiProperty({ example: 'O(n)', nullable: true })
  timeComplexity!: string | null;

  @ApiProperty({ example: 'O(n)', nullable: true })
  spaceComplexity!: string | null;

  @ApiProperty({ example: 'A clean single pass.', nullable: true })
  summary!: string | null;

  @ApiProperty({ type: [CodeReviewFindingResponseDto] })
  findings!: CodeReviewFindingResponseDto[];

  @ApiProperty({ nullable: true })
  failureReason!: string | null;

  @ApiProperty({ example: '2026-11-06T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-06T10:00:09.000Z', nullable: true })
  completedAt!: string | null;
}

export class CodeReviewQuotaResponseDto implements CodeReviewQuotaDto {
  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 3 })
  used!: number;

  @ApiProperty({ example: 7 })
  remaining!: number;

  @ApiProperty({ example: true })
  enabled!: boolean;
}
