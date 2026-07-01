import { ApiProperty } from '@nestjs/swagger';
import { ProblemDiscussionCommentDto } from '@elevatesde/shared-types';
import { ForumAuthorResponseDto } from '../../../forum/presentation/dtos/forum-author-response.dto';

export class ProblemDiscussionCommentResponseDto implements ProblemDiscussionCommentDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'uuid-discussion' })
  discussionId!: string;

  @ApiProperty({ type: ForumAuthorResponseDto })
  author!: ForumAuthorResponseDto;

  @ApiProperty({ example: 'The two-pointer version only works when the array is sorted.' })
  body!: string;

  @ApiProperty({ example: 8 })
  upvotes!: number;

  @ApiProperty({ example: false })
  hasUpvoted!: boolean;

  @ApiProperty({ example: '2026-07-01T08:05:00.000Z' })
  createdAt!: string;
}
