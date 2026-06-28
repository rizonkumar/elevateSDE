import { ApiProperty } from '@nestjs/swagger';
import { AdminBadgeDto } from '@elevatesde/shared-types';
import { BadgeResponseDto } from './badge-response.dto';

export class AdminBadgeResponseDto extends BadgeResponseDto implements AdminBadgeDto {
  @ApiProperty({ example: 42 })
  awardCount!: number;
}
