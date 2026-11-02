import { ApiProperty } from '@nestjs/swagger';
import {
  AssessmentLanguage,
  EditorialUnlockReason,
  ProblemEditorialDto,
} from '@elevatesde/shared-types';

export class ProblemEditorialResponseDto implements ProblemEditorialDto {
  @ApiProperty({ example: 'uuid-problem' })
  problemId!: string;

  @ApiProperty({ example: 'Store each value in a hash map as you scan the array.' })
  approach!: string;

  @ApiProperty({ example: 'O(n)' })
  timeComplexity!: string;

  @ApiProperty({ example: 'O(n)' })
  spaceComplexity!: string;

  @ApiProperty({
    example: { python: 'class Solution:\n    def twoSum(self, nums, target): ...' },
  })
  solutions!: Partial<Record<AssessmentLanguage, string>>;

  @ApiProperty({ enum: ['SOLVED', 'GAVE_UP'] })
  unlockReason!: EditorialUnlockReason;

  @ApiProperty({ example: '2026-11-02T08:00:00.000Z' })
  updatedAt!: string;
}
