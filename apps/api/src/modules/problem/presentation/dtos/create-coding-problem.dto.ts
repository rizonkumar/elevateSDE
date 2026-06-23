import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { AssessmentDifficulty } from '@prisma/client';
import { AdminCodingProblemInput, AssessmentLanguage } from '@elevatesde/shared-types';
import { CodingProblemTestCaseDto } from './coding-problem-test-case.dto';

export class CreateCodingProblemDto implements AdminCodingProblemInput {
  @ApiProperty({ example: 'Two Sum' })
  @IsString()
  title!: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  @IsEnum(AssessmentDifficulty)
  difficulty!: AssessmentDifficulty;

  @ApiProperty({ example: 'Given an array of integers...' })
  @IsString()
  description!: string;

  @ApiProperty({ example: ['2 <= nums.length <= 10^4'] })
  @IsArray()
  @IsString({ each: true })
  constraints!: string[];

  @ApiProperty({ example: ['Array', 'Hash Map'] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @ApiProperty({
    example: { javascript: 'function twoSum() {}', python: 'def two_sum():', cpp: 'int main(){}' },
  })
  @IsObject()
  starterCode!: Record<AssessmentLanguage, string>;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  timeLimitMinutes!: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isPublished!: boolean;

  @ApiProperty({ type: [CodingProblemTestCaseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CodingProblemTestCaseDto)
  testCases!: CodingProblemTestCaseDto[];
}
