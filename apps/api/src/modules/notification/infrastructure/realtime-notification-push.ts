import { Injectable } from '@nestjs/common';
import { RealtimePublisher } from '../../realtime/domain/realtime-publisher';
import { Notification } from '../domain/entities/notification';
import { INotificationPush } from '../domain/interfaces/notification-push.interface';
import { NotificationPushMapper } from './mappers/notification-push.mapper';

@Injectable()
export class RealtimeNotificationPush extends INotificationPush {
  constructor(private readonly realtime: RealtimePublisher) {
    super();
  }

  pushCreated(notification: Notification, unreadCount: number): void {
    this.realtime.toUser(notification.getUserId(), 'notification:new', {
      notification: NotificationPushMapper.toNotificationDto(notification),
      unreadCount,
    });
  }

  pushUnreadCount(userId: string, unreadCount: number): void {
    this.realtime.toUser(userId, 'notification:unread-count', { unreadCount });
  }
}
