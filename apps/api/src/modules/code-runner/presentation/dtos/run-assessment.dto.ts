import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import {
  ASSESSMENT_LANGUAGES,
  AssessmentLanguage,
  AssessmentRunRequestDto,
} from '@elevatesde/shared-types';

const LANGUAGES: readonly AssessmentLanguage[] = ASSESSMENT_LANGUAGES;

export class RunAssessmentDto implements AssessmentRunRequestDto {
  @ApiProperty({ example: 'uuid-string' })
  @IsUUID()
  problemId!: string;

  @ApiProperty({ enum: LANGUAGES })
  @IsIn(LANGUAGES)
  language!: AssessmentLanguage;

  @ApiProperty({ example: 'function twoSum(nums, target) { return [0, 1]; }' })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  code!: string;
}
