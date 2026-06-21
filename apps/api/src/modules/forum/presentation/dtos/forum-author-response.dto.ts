import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ForumAuthor } from '@elevatesde/shared-types';

export class ForumAuthorResponseDto implements ForumAuthor {
  @ApiProperty({ example: 'u-kenji' })
  id!: string;

  @ApiProperty({ example: 'Kenji Watanabe' })
  name!: string;

  @ApiPropertyOptional({ example: 'Distributed systems', nullable: true })
  headline!: string | null;
}
