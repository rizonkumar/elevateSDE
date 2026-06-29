import { ApiProperty } from '@nestjs/swagger';
import { NotificationPreferenceDto, NotificationType } from '@elevatesde/shared-types';

const NOTIFICATION_TYPES: NotificationType[] = [
  'BADGE_AWARDED',
  'STREAK_MILESTONE',
  'FORUM_REPLY',
  'FORUM_UPVOTE',
  'SUBMISSION_ACCEPTED',
  'SYSTEM',
];

export class NotificationPreferenceResponseDto implements NotificationPreferenceDto {
  @ApiProperty({ enum: NOTIFICATION_TYPES })
  type!: NotificationType;

  @ApiProperty({ example: true })
  inAppEnabled!: boolean;
}
