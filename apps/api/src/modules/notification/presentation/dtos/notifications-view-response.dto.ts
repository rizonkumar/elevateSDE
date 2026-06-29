import { ApiProperty } from '@nestjs/swagger';
import { NotificationsViewDto } from '@elevatesde/shared-types';
import { NotificationResponseDto } from './notification-response.dto';

export class NotificationsViewResponseDto implements NotificationsViewDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  notifications!: NotificationResponseDto[];

  @ApiProperty({ example: 3 })
  unreadCount!: number;
}
