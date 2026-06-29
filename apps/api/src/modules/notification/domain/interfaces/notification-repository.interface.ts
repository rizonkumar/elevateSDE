import { NotificationType } from '@prisma/client';
import { Notification } from '../entities/notification';
import { NotificationPreferenceView } from '../read-models/notification-view';

export abstract class INotificationRepository {
  abstract create(notification: Notification): Promise<void>;
  abstract listForUser(userId: string, limit: number): Promise<Notification[]>;
  abstract countUnread(userId: string): Promise<number>;
  abstract markRead(userId: string, id: string): Promise<void>;
  abstract markAllRead(userId: string): Promise<void>;
  abstract listPreferences(userId: string): Promise<NotificationPreferenceView[]>;
  abstract findPreference(userId: string, type: NotificationType): Promise<boolean | null>;
  abstract upsertPreference(userId: string, type: NotificationType, inAppEnabled: boolean): Promise<void>;
}
