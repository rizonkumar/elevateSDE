import { ApiProperty } from '@nestjs/swagger';
import { UserBadgeDto } from '@elevatesde/shared-types';
import { BadgeResponseDto } from './badge-response.dto';

export class UserBadgeResponseDto extends BadgeResponseDto implements UserBadgeDto {
  @ApiProperty({ example: '2026-06-28T00:00:00.000Z' })
  awardedAt!: string;
}
