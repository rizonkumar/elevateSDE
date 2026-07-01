import { ApiProperty } from '@nestjs/swagger';
import { ProblemCollectionItemDto } from '@elevatesde/shared-types';
import { ProblemSummaryResponseDto } from '../../../problem/presentation/dtos/problem-summary-response.dto';

export class ProblemCollectionItemResponseDto implements ProblemCollectionItemDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 0 })
  ordinal!: number;

  @ApiProperty({ type: ProblemSummaryResponseDto })
  problem!: ProblemSummaryResponseDto;
}
