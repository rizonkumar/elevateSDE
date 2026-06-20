import { ApiProperty } from '@nestjs/swagger';
import { TestCaseResultDto, TestCaseResultStatus } from '@elevatesde/shared-types';

export class TestCaseResultResponseDto implements TestCaseResultDto {
  @ApiProperty({ example: 'uuid-string' })
  testCaseId!: string;

  @ApiProperty({ example: 'Case 1' })
  label!: string;

  @ApiProperty({ enum: ['PASS', 'FAIL', 'ERROR'] })
  status!: TestCaseResultStatus;

  @ApiProperty({ example: '[2,7,11,15], 9' })
  input!: string;

  @ApiProperty({ example: '[0,1]' })
  expectedOutput!: string;

  @ApiProperty({ example: '[0,1]' })
  actualOutput!: string;

  @ApiProperty({ example: false })
  isHidden!: boolean;

  @ApiProperty({ example: 12.4 })
  runtimeMs!: number;

  @ApiProperty({ example: 4820 })
  memoryKb!: number;
}
