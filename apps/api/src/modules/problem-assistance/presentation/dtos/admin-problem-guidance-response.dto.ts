import { ApiProperty } from '@nestjs/swagger';
import { AdminProblemEditorialDto, AdminProblemGuidanceDto } from '@elevatesde/shared-types';

export class AdminProblemEditorialResponseDto implements AdminProblemEditorialDto {
  @ApiProperty({ example: 'Store each value in a hash map as you scan the array.' })
  approach!: string;

  @ApiProperty({ example: 'O(n)' })
  timeComplexity!: string;

  @ApiProperty({ example: 'O(n)' })
  spaceComplexity!: string;

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiProperty({ example: '2026-11-02T08:00:00.000Z' })
  updatedAt!: string;
}

export class AdminProblemGuidanceResponseDto implements AdminProblemGuidanceDto {
  @ApiProperty({ example: 'uuid-problem' })
  problemId!: string;

  @ApiProperty({ type: AdminProblemEditorialResponseDto, nullable: true })
  editorial!: AdminProblemEditorialResponseDto | null;

  @ApiProperty({ example: ['Think about what you need to remember while scanning.'] })
  hints!: string[];
}
