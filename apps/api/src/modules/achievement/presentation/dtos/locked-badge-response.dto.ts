import { ApiProperty } from '@nestjs/swagger';
import { LockedBadgeDto } from '@elevatesde/shared-types';
import { BadgeResponseDto } from './badge-response.dto';

export class LockedBadgeResponseDto extends BadgeResponseDto implements LockedBadgeDto {
  @ApiProperty({ example: 3 })
  progress!: number;
}
