import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import { ContestProblemInput, SetContestProblemsInput } from '@elevatesde/shared-types';

export class ContestProblemInputDto implements ContestProblemInput {
  @ApiProperty({ example: 'uuid-string' })
  @IsUUID()
  problemId!: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  points!: number;
}

export class SetContestProblemsDto implements SetContestProblemsInput {
  @ApiProperty({ type: [ContestProblemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ContestProblemInputDto)
  problems!: ContestProblemInputDto[];
}
