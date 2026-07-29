import { ApiProperty } from '@nestjs/swagger';
import { PublicCollectionListDto } from '@elevatesde/shared-types';
import { PublicCollectionSummaryResponseDto } from './public-collection-summary-response.dto';

export class PublicCollectionListResponseDto implements PublicCollectionListDto {
  @ApiProperty({ type: [PublicCollectionSummaryResponseDto] })
  items!: PublicCollectionSummaryResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
