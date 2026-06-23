import { ApiProperty } from '@nestjs/swagger';
import { AdminProblemListDto } from '@elevatesde/shared-types';
import { AdminProblemSummaryResponseDto } from './admin-problem-summary-response.dto';

export class AdminProblemListResponseDto implements AdminProblemListDto {
  @ApiProperty({ type: [AdminProblemSummaryResponseDto] })
  items!: AdminProblemSummaryResponseDto[];

  @ApiProperty({ example: 512 })
  total!: number;
}
