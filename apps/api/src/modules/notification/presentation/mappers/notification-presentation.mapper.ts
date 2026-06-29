import { Notification } from '../../domain/entities/notification';
import { NotificationPreferenceView, NotificationsView } from '../../domain/read-models/notification-view';
import { NotificationPreferenceResponseDto } from '../dtos/notification-preference-response.dto';
import { NotificationResponseDto } from '../dtos/notification-response.dto';
import { NotificationsViewResponseDto } from '../dtos/notifications-view-response.dto';

export class NotificationPresentationMapper {
  static toNotification(notification: Notification): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = notification.getId();
    dto.type = notification.getType();
    dto.title = notification.getTitle();
    dto.body = notification.getBody();
    dto.linkUrl = notification.getLinkUrl();
    dto.isRead = notification.isRead();
    dto.createdAt = notification.getCreatedAt().toISOString();
    return dto;
  }

  static toView(view: NotificationsView): NotificationsViewResponseDto {
    const dto = new NotificationsViewResponseDto();
    dto.notifications = view.notifications.map((notification) => this.toNotification(notification));
    dto.unreadCount = view.unreadCount;
    return dto;
  }

  static toPreference(view: NotificationPreferenceView): NotificationPreferenceResponseDto {
    const dto = new NotificationPreferenceResponseDto();
    dto.type = view.type;
    dto.inAppEnabled = view.inAppEnabled;
    return dto;
  }
}
