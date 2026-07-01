import { ApiProperty } from '@nestjs/swagger';
import { ProblemDiscussionDto } from '@elevatesde/shared-types';
import { ForumAuthorResponseDto } from '../../../forum/presentation/dtos/forum-author-response.dto';

export class ProblemDiscussionResponseDto implements ProblemDiscussionDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'uuid-problem' })
  problemId!: string;

  @ApiProperty({ example: 'Cleaner two-pointer approach?' })
  title!: string;

  @ApiProperty({ example: 'I solved this with a hash map but wondered about the two-pointer...' })
  body!: string;

  @ApiProperty({ type: ForumAuthorResponseDto })
  author!: ForumAuthorResponseDto;

  @ApiProperty({ example: 12 })
  upvotes!: number;

  @ApiProperty({ example: false })
  hasUpvoted!: boolean;

  @ApiProperty({ example: 4 })
  replyCount!: number;

  @ApiProperty({ example: '2026-07-01T07:40:00.000Z' })
  createdAt!: string;
}
