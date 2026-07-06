import { ApiProperty } from '@nestjs/swagger';
import { AdminContestListDto } from '@elevatesde/shared-types';
import { ContestSummaryResponseDto } from './contest-summary-response.dto';

export class ContestListResponseDto implements AdminContestListDto {
  @ApiProperty({ type: [ContestSummaryResponseDto] })
  items!: ContestSummaryResponseDto[];

  @ApiProperty({ example: 12 })
  total!: number;
}
