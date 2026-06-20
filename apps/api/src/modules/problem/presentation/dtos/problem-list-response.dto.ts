import { ApiProperty } from '@nestjs/swagger';
import { ProblemListDto } from '@elevatesde/shared-types';
import { ProblemSummaryResponseDto } from './problem-summary-response.dto';

export class ProblemListResponseDto implements ProblemListDto {
  @ApiProperty({ type: [ProblemSummaryResponseDto] })
  items!: ProblemSummaryResponseDto[];

  @ApiProperty({ example: 512 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
