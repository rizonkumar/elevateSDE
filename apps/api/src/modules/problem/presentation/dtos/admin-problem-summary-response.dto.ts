import { ApiProperty } from '@nestjs/swagger';
import { AdminProblemSummaryDto, AssessmentDifficulty } from '@elevatesde/shared-types';

export class AdminProblemSummaryResponseDto implements AdminProblemSummaryDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'Two Sum' })
  title!: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  difficulty!: AssessmentDifficulty;

  @ApiProperty({ example: ['Array', 'Hash Map'] })
  tags!: string[];

  @ApiProperty({ example: 30 })
  timeLimitMinutes!: number;

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ example: 4 })
  testCaseCount!: number;

  @ApiProperty({ example: '2026-01-12T09:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-02-04T11:30:00.000Z' })
  updatedAt!: string;
}
