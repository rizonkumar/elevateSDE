import { ApiProperty } from '@nestjs/swagger';
import { BookmarkDto } from '@elevatesde/shared-types';
import { ProblemSummaryResponseDto } from '../../../problem/presentation/dtos/problem-summary-response.dto';

export class BookmarkResponseDto implements BookmarkDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ type: ProblemSummaryResponseDto })
  problem!: ProblemSummaryResponseDto;

  @ApiProperty({ example: '2026-07-01T08:05:00.000Z' })
  createdAt!: string;
}
