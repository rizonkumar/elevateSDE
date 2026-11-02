import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AdminProblemHintsInput } from '@elevatesde/shared-types';
import { MAX_HINT_LENGTH, MAX_HINTS_PER_PROBLEM } from '../../domain/policies/guidance-limits';

export class SaveProblemHintsDto implements AdminProblemHintsInput {
  @ApiProperty({ example: ['Think about what you need to remember while scanning.'] })
  @IsArray()
  @ArrayMaxSize(MAX_HINTS_PER_PROBLEM)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(MAX_HINT_LENGTH, { each: true })
  hints!: string[];
}
