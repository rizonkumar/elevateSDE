import { NotificationType } from '@prisma/client';
import { Notification } from '../entities/notification';

export interface NotificationsView {
  notifications: Notification[];
  unreadCount: number;
}

export interface NotificationPreferenceView {
  type: NotificationType;
  inAppEnabled: boolean;
}
