import { ApiProperty } from '@nestjs/swagger';
import { AssessmentDifficulty, ProblemSummaryDto } from '@elevatesde/shared-types';

export class ProblemSummaryResponseDto implements ProblemSummaryDto {
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
}
