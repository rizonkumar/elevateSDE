import { ApiProperty } from '@nestjs/swagger';
import {
  AdminContestDetailDto,
  AssessmentDifficulty,
  ContestProblemDto,
} from '@elevatesde/shared-types';
import { ContestSummaryResponseDto } from './contest-summary-response.dto';

export class ContestProblemResponseDto implements ContestProblemDto {
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
}

export class ContestDetailResponseDto
  extends ContestSummaryResponseDto
  implements AdminContestDetailDto
{
  @ApiProperty({ example: 'A one-hour speed round over three array problems.' })
  description!: string;

  @ApiProperty({ type: [ContestProblemResponseDto] })
  problems!: ContestProblemResponseDto[];
}
