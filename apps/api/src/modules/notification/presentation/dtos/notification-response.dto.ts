import { ApiProperty } from '@nestjs/swagger';
import { NotificationDto, NotificationType } from '@elevatesde/shared-types';

const NOTIFICATION_TYPES: NotificationType[] = [
  'BADGE_AWARDED',
  'STREAK_MILESTONE',
  'FORUM_REPLY',
  'FORUM_UPVOTE',
  'SUBMISSION_ACCEPTED',
  'SYSTEM',
];

export class NotificationResponseDto implements NotificationDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ enum: NOTIFICATION_TYPES })
  type!: NotificationType;

  @ApiProperty({ example: 'Badge unlocked' })
  title!: string;

  @ApiProperty({ example: 'You earned the "First Blood" badge.' })
  body!: string;

  @ApiProperty({ example: '/dashboard/achievements', nullable: true })
  linkUrl!: string | null;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({ example: '2026-06-29T00:00:00.000Z' })
  createdAt!: string;
}
