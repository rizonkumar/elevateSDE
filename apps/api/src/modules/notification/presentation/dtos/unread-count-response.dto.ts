import { ApiProperty } from '@nestjs/swagger';
import { UnreadCountDto } from '@elevatesde/shared-types';

export class UnreadCountResponseDto implements UnreadCountDto {
  @ApiProperty({ example: 3 })
  unreadCount!: number;
}
