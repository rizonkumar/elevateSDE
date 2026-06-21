import { ApiProperty } from '@nestjs/swagger';
import { AssessmentRunResultDto, AssessmentRunStatus } from '@elevatesde/shared-types';
import { TestCaseResultResponseDto } from './test-case-result-response.dto';

export class AssessmentRunResponseDto implements AssessmentRunResultDto {
  @ApiProperty({ enum: ['ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR'] })
  status!: AssessmentRunStatus;

  @ApiProperty({ type: [TestCaseResultResponseDto] })
  results!: TestCaseResultResponseDto[];

  @ApiProperty({ example: 4 })
  passedCount!: number;

  @ApiProperty({ example: 4 })
  totalCount!: number;

  @ApiProperty({ example: 38.2 })
  totalRuntimeMs!: number;

  @ApiProperty({ example: 5120 })
  peakMemoryKb!: number;

  @ApiProperty({ example: 'Executed 4 test case(s).' })
  stdout!: string;

  @ApiProperty({ example: '2026-06-20T08:11:29.000Z' })
  ranAt!: string;
}
