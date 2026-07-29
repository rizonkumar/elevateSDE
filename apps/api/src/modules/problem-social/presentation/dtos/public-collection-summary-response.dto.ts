import { ApiProperty } from '@nestjs/swagger';
import { PublicCollectionSummaryDto } from '@elevatesde/shared-types';
import { ForumAuthorResponseDto } from '../../../forum/presentation/dtos/forum-author-response.dto';

export class PublicCollectionSummaryResponseDto implements PublicCollectionSummaryDto {
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
}
