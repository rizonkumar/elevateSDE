import { ApiProperty } from '@nestjs/swagger';
import { ProblemListItemDto, ProblemProgressStatus } from '@elevatesde/shared-types';
import { ProblemSummaryResponseDto } from './problem-summary-response.dto';
import { CompanyRefResponseDto, TopicRefResponseDto } from './taxonomy-ref-response.dto';

export class ProblemListItemResponseDto
  extends ProblemSummaryResponseDto
  implements ProblemListItemDto
{
  @ApiProperty({ type: [TopicRefResponseDto] })
  topics!: TopicRefResponseDto[];

  @ApiProperty({ type: [CompanyRefResponseDto] })
  companies!: CompanyRefResponseDto[];

  @ApiProperty({ enum: ['SOLVED', 'ATTEMPTED', 'TODO'] })
  status!: ProblemProgressStatus;
}
