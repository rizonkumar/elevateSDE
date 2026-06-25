import { ApiProperty } from '@nestjs/swagger';
import { DailyChallengeDto } from '@elevatesde/shared-types';
import { ProblemSummaryResponseDto } from '../../../problem/presentation/dtos/problem-summary-response.dto';

export class DailyChallengeResponseDto implements DailyChallengeDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: '2026-06-25' })
  challengeDate!: string;

  @ApiProperty({ type: ProblemSummaryResponseDto })
  problem!: ProblemSummaryResponseDto;

  @ApiProperty({ example: false })
  completed!: boolean;
}
