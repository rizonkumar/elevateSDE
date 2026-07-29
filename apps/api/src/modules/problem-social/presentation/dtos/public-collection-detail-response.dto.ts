import { ApiProperty } from '@nestjs/swagger';
import { PublicCollectionDetailDto } from '@elevatesde/shared-types';
import { ForumAuthorResponseDto } from '../../../forum/presentation/dtos/forum-author-response.dto';
import { ProblemCollectionItemResponseDto } from './problem-collection-item-response.dto';

export class PublicCollectionDetailResponseDto implements PublicCollectionDetailDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'Blind 75 - Arrays & Hashing' })
  name!: string;

  @ApiProperty({ example: 12 })
  itemCount!: number;

  @ApiProperty({ example: '2026-07-01T08:05:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: ForumAuthorResponseDto })
  author!: ForumAuthorResponseDto;

  @ApiProperty({ type: [ProblemCollectionItemResponseDto] })
  items!: ProblemCollectionItemResponseDto[];

  @ApiProperty({ type: [String] })
  viewerSolvedProblemIds!: string[];
}
