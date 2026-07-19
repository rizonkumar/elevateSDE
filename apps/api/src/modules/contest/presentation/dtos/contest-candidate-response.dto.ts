import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentDifficulty,
  ContestDetailDto,
  ContestProblemProgressDto,
  ContestStandingRowDto,
  ContestStatus,
  ContestSummaryDto,
} from '@elevatesde/shared-types';

export class ContestCandidateSummaryResponseDto implements ContestSummaryDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'weekly-sprint-12' })
  slug!: string;

  @ApiProperty({ example: 'Weekly Sprint #12' })
  title!: string;

  @ApiProperty({ enum: ['DRAFT', 'SCHEDULED', 'LIVE', 'ENDED'] })
  status!: ContestStatus;

  @ApiProperty({ example: '2026-07-19T18:00:00.000Z' })
  startsAt!: string;

  @ApiProperty({ example: '2026-07-19T19:30:00.000Z' })
  endsAt!: string;

  @ApiProperty({ example: 3 })
  problemCount!: number;

  @ApiProperty({ example: 42 })
  participantCount!: number;

  @ApiProperty({ example: false })
  registered!: boolean;
}

export class ContestCandidateProblemResponseDto implements ContestProblemProgressDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'uuid-string' })
  problemId!: string;

  @ApiProperty({ example: 'Two Sum' })
  title!: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  difficulty!: AssessmentDifficulty;

  @ApiProperty({ example: 0 })
  ordinal!: number;

  @ApiProperty({ example: 100 })
  points!: number;

  @ApiProperty({ example: false })
  solved!: boolean;
}

export class ContestCandidateDetailResponseDto
  extends ContestCandidateSummaryResponseDto
  implements ContestDetailDto
{
  @ApiProperty({ example: 'A one-hour speed round over three array problems.' })
  description!: string;

  @ApiProperty({ type: [ContestCandidateProblemResponseDto] })
  problems!: ContestCandidateProblemResponseDto[];
}

export class ContestStandingRowResponseDto implements ContestStandingRowDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: 'uuid-string' })
  userId!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name!: string;

  @ApiProperty({ example: 2 })
  solvedCount!: number;

  @ApiProperty({ example: 200 })
  score!: number;

  @ApiProperty({ example: 1860 })
  penaltySeconds!: number;

  @ApiProperty({ example: false })
  isCurrentUser!: boolean;
}
