import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AdminProblemEditorialInput } from '@elevatesde/shared-types';
import { MAX_APPROACH_LENGTH, MAX_COMPLEXITY_LENGTH } from '../../domain/policies/guidance-limits';

export class SaveProblemEditorialDto implements AdminProblemEditorialInput {
  @ApiProperty({ example: 'Store each value in a hash map as you scan the array.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_APPROACH_LENGTH)
  approach!: string;

  @ApiProperty({ example: 'O(n)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_COMPLEXITY_LENGTH)
  timeComplexity!: string;

  @ApiProperty({ example: 'O(n)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_COMPLEXITY_LENGTH)
  spaceComplexity!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isPublished!: boolean;
}
