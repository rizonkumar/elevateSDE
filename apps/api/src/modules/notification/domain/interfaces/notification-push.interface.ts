import { Notification } from '../entities/notification';

export abstract class INotificationPush {
  abstract pushCreated(notification: Notification, unreadCount: number): void;
  abstract pushUnreadCount(userId: string, unreadCount: number): void;
}
