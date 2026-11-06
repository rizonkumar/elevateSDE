import type { NotificationDto } from '@elevatesde/shared-types';
import { Notification } from '../../domain/entities/notification';

export class NotificationPushMapper {
  static toNotificationDto(notification: Notification): NotificationDto {
    return {
      id: notification.getId(),
      type: notification.getType(),
      title: notification.getTitle(),
      body: notification.getBody(),
      linkUrl: notification.getLinkUrl(),
      isRead: notification.isRead(),
      createdAt: notification.getCreatedAt().toISOString(),
    };
  }
}
