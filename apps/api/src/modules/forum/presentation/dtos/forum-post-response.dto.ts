import { ApiProperty } from '@nestjs/swagger';
import { ForumPostDto } from '@elevatesde/shared-types';
import { ForumAuthorResponseDto } from './forum-author-response.dto';

export class ForumPostResponseDto implements ForumPostDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'How would you design a distributed rate limiter?' })
  title!: string;

  @ApiProperty({ example: 'I went with a token bucket per client in Redis...' })
  body!: string;

  @ApiProperty({ example: ['system-design', 'faang'], type: [String] })
  tags!: string[];

  @ApiProperty({ type: ForumAuthorResponseDto })
  author!: ForumAuthorResponseDto;

  @ApiProperty({ example: 142 })
  upvotes!: number;

  @ApiProperty({ example: false })
  hasUpvoted!: boolean;

  @ApiProperty({ example: 3 })
  replyCount!: number;

  @ApiProperty({ example: 2140 })
  viewCount!: number;

  @ApiProperty({ example: '2026-06-19T07:40:00.000Z' })
  createdAt!: string;
}
