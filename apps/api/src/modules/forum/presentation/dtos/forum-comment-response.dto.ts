import { ApiProperty } from '@nestjs/swagger';
import { ForumCommentDto } from '@elevatesde/shared-types';
import { ForumAuthorResponseDto } from './forum-author-response.dto';

export class ForumCommentResponseDto implements ForumCommentDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'post-rate-limiter' })
  postId!: string;

  @ApiProperty({ type: ForumAuthorResponseDto })
  author!: ForumAuthorResponseDto;

  @ApiProperty({ example: 'Use local token buckets per node with periodic reconciliation.' })
  body!: string;

  @ApiProperty({ example: 41 })
  upvotes!: number;

  @ApiProperty({ example: false })
  hasUpvoted!: boolean;

  @ApiProperty({ example: '2026-06-19T08:05:00.000Z' })
  createdAt!: string;
}
