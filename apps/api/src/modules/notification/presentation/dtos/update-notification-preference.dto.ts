import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn } from 'class-validator';
import { NotificationType, UpdateNotificationPreferenceDto as IUpdateNotificationPreferenceDto } from '@elevatesde/shared-types';

const NOTIFICATION_TYPES: NotificationType[] = [
  'BADGE_AWARDED',
  'STREAK_MILESTONE',
  'FORUM_REPLY',
  'FORUM_UPVOTE',
  'SUBMISSION_ACCEPTED',
  'SYSTEM',
];

export class UpdateNotificationPreferenceDto implements IUpdateNotificationPreferenceDto {
  @ApiProperty({ enum: NOTIFICATION_TYPES })
  @IsIn(NOTIFICATION_TYPES)
  type!: NotificationType;

  @ApiProperty({ example: true })
  @IsBoolean()
  inAppEnabled!: boolean;
}
