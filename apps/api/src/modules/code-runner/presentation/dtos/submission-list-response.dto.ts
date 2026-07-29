import { ApiProperty } from '@nestjs/swagger';
import { SubmissionListDto } from '@elevatesde/shared-types';
import { SubmissionSummaryResponseDto } from './submission-summary-response.dto';

export class SubmissionListResponseDto implements SubmissionListDto {
  @ApiProperty({ type: [SubmissionSummaryResponseDto] })
  items!: SubmissionSummaryResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
