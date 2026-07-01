import { ApiProperty } from '@nestjs/swagger';
import { ProblemCollectionDto } from '@elevatesde/shared-types';
import { ProblemCollectionItemResponseDto } from './problem-collection-item-response.dto';

export class ProblemCollectionResponseDto implements ProblemCollectionDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'Blind 75 - Arrays' })
  name!: string;

  @ApiProperty({ example: false })
  isPublic!: boolean;

  @ApiProperty({ example: 12 })
  itemCount!: number;

  @ApiProperty({ type: [ProblemCollectionItemResponseDto] })
  items!: ProblemCollectionItemResponseDto[];

  @ApiProperty({ example: '2026-07-01T08:05:00.000Z' })
  createdAt!: string;
}
