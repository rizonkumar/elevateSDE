import { ApiProperty } from '@nestjs/swagger';
import { ProblemListDto } from '@elevatesde/shared-types';
import { ProblemListItemResponseDto } from './problem-list-item-response.dto';

export class ProblemListResponseDto implements ProblemListDto {
  @ApiProperty({ type: [ProblemListItemResponseDto] })
  items!: ProblemListItemResponseDto[];

  @ApiProperty({ example: 512 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
