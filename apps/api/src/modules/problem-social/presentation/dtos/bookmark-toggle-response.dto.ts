import { ApiProperty } from '@nestjs/swagger';
import { BookmarkToggleDto } from '@elevatesde/shared-types';

export class BookmarkToggleResponseDto implements BookmarkToggleDto {
  @ApiProperty({ example: true })
  bookmarked!: boolean;
}
