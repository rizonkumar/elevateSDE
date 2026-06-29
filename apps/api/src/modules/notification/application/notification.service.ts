import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { INotificationRepository } from '../domain/interfaces/notification-repository.interface';
import { Notification, NotificationDraft } from '../domain/entities/notification';
import { NotificationPreferenceView, NotificationsView } from '../domain/read-models/notification-view';

const LIST_LIMIT = 50;

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'BADGE_AWARDED',
  'STREAK_MILESTONE',
  'FORUM_REPLY',
  'FORUM_UPVOTE',
  'SUBMISSION_ACCEPTED',
  'SYSTEM',
];

const DEFAULT_DISABLED_TYPES: NotificationType[] = ['SUBMISSION_ACCEPTED'];

@Injectable()
export class NotificationService {
  constructor(private readonly repository: INotificationRepository) {}

  async notify(draft: NotificationDraft): Promise<void> {
    if (!(await this.isEnabled(draft.userId, draft.type))) {
      return;
    }
    await this.repository.create(Notification.create(draft));
  }

  async listForUser(userId: string): Promise<NotificationsView> {
    const [notifications, unreadCount] = await Promise.all([
      this.repository.listForUser(userId, LIST_LIMIT),
      this.repository.countUnread(userId),
    ]);
    return { notifications, unreadCount };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.repository.countUnread(userId);
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.repository.markRead(userId, id);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repository.markAllRead(userId);
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceView[]> {
    const stored = await this.repository.listPreferences(userId);
    const storedByType = new Map(stored.map((preference) => [preference.type, preference.inAppEnabled]));
    return ALL_NOTIFICATION_TYPES.map((type) => ({
      type,
      inAppEnabled: storedByType.get(type) ?? this.defaultEnabled(type),
    }));
  }

  async updatePreference(userId: string, type: NotificationType, inAppEnabled: boolean): Promise<NotificationPreferenceView[]> {
    await this.repository.upsertPreference(userId, type, inAppEnabled);
    return this.getPreferences(userId);
  }

  private async isEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const stored = await this.repository.findPreference(userId, type);
    return stored ?? this.defaultEnabled(type);
  }

  private defaultEnabled(type: NotificationType): boolean {
    return !DEFAULT_DISABLED_TYPES.includes(type);
  }
}
