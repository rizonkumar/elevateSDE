import { ApiProperty } from '@nestjs/swagger';
import { ReviewItemDto } from '@elevatesde/shared-types';
import { ProblemSummaryResponseDto } from '../../../problem/presentation/dtos/problem-summary-response.dto';

export class ReviewItemResponseDto implements ReviewItemDto {
  @ApiProperty({ type: ProblemSummaryResponseDto })
  problem!: ProblemSummaryResponseDto;

  @ApiProperty({ example: 2.5 })
  ease!: number;

  @ApiProperty({ example: 6 })
  intervalDays!: number;

  @ApiProperty({ example: 2 })
  repetitions!: number;

  @ApiProperty({ example: '2026-07-10T00:00:00.000Z' })
  dueAt!: string;

  @ApiProperty({ example: '2026-07-04T09:30:00.000Z', nullable: true })
  lastReviewedAt!: string | null;
}
