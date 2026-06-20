import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentDifficulty,
  AssessmentLanguage,
  AssessmentTestCase,
  CodingProblemDto,
  CodingProblemExample,
} from '@elevatesde/shared-types';

export class CodingProblemResponseDto implements CodingProblemDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'Two Sum' })
  title!: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  difficulty!: AssessmentDifficulty;

  @ApiProperty()
  description!: string;

  @ApiProperty({ example: ['2 <= nums.length <= 10^4'] })
  constraints!: string[];

  @ApiProperty({ example: ['Array', 'Hash Map'] })
  tags!: string[];

  @ApiProperty({
    example: {
      javascript: 'function twoSum(nums, target) {}',
      python: 'def two_sum(nums, target):',
      cpp: 'vector<int> twoSum(vector<int>& nums, int target) {}',
    },
  })
  starterCode!: Record<AssessmentLanguage, string>;

  @ApiProperty({
    example: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: null }],
  })
  examples!: CodingProblemExample[];

  @ApiProperty({
    example: [{ id: 'uuid', input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false }],
  })
  testCases!: AssessmentTestCase[];

  @ApiProperty({ example: 30 })
  timeLimitMinutes!: number;
}
