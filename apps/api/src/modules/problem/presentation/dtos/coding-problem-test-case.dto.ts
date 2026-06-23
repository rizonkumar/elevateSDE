import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';
import { AdminTestCaseInput } from '@elevatesde/shared-types';

export class CodingProblemTestCaseDto implements AdminTestCaseInput {
  @ApiProperty({ example: '[2,7,11,15], 9' })
  @IsString()
  input!: string;

  @ApiProperty({ example: '[0,1]' })
  @IsString()
  expectedOutput!: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isHidden!: boolean;
}
