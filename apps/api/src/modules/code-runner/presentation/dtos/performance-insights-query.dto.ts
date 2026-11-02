import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';
import { AssessmentLanguage } from '@elevatesde/shared-types';
import { PROBLEM_LANGUAGES } from '../../application/language';

export class PerformanceInsightsQueryDto {
  @ApiProperty({ example: 'uuid-problem' })
  @IsUUID()
  problemId!: string;

  @ApiProperty({ enum: PROBLEM_LANGUAGES })
  @IsIn(PROBLEM_LANGUAGES)
  language!: AssessmentLanguage;
}
