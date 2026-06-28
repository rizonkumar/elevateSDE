import { ApiProperty } from '@nestjs/swagger';
import { AchievementsViewDto } from '@elevatesde/shared-types';
import { UserBadgeResponseDto } from './user-badge-response.dto';
import { LockedBadgeResponseDto } from './locked-badge-response.dto';

export class AchievementsViewResponseDto implements AchievementsViewDto {
  @ApiProperty({ type: [UserBadgeResponseDto] })
  earned!: UserBadgeResponseDto[];

  @ApiProperty({ type: [LockedBadgeResponseDto] })
  locked!: LockedBadgeResponseDto[];
}
