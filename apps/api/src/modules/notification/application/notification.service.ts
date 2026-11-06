import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { INotificationPush } from '../domain/interfaces/notification-push.interface';
import { INotificationRepository } from '../domain/interfaces/notification-repository.interface';
import { Notification, NotificationDraft } from '../domain/entities/notification';
import {
  NotificationPreferenceView,
  NotificationsView,
} from '../domain/read-models/notification-view';

const LIST_LIMIT = 50;

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'BADGE_AWARDED',
  'STREAK_MILESTONE',
  'FORUM_REPLY',
  'FORUM_UPVOTE',
  'SUBMISSION_ACCEPTED',
  'PREPARATION_REMINDER',
  'PEER_INVITATION',
  'PEER_SESSION_CHANGED',
  'SCORECARD_REQUEST',
  'CODE_REVIEW_READY',
  'CONTEST_RATING_UPDATED',
  'STUDY_GROUP_ADDED',
  'STUDY_GOAL_COMPLETED',
  'SYSTEM',
];

const DEFAULT_DISABLED_TYPES: NotificationType[] = ['SUBMISSION_ACCEPTED'];

@Injectable()
export class NotificationService {
  constructor(
    private readonly repository: INotificationRepository,
    private readonly push: INotificationPush,
  ) {}

  async notify(draft: NotificationDraft): Promise<void> {
    if (!(await this.isEnabled(draft.userId, draft.type))) {
      return;
    }
    const notification = Notification.create(draft);
    if (!(await this.repository.create(notification))) {
      return;
    }
    const unreadCount = await this.repository.countUnread(draft.userId);
    this.push.pushCreated(notification, unreadCount);
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
    await this.publishUnreadCount(userId);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repository.markAllRead(userId);
    await this.publishUnreadCount(userId);
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceView[]> {
    const stored = await this.repository.listPreferences(userId);
    const storedByType = new Map(
      stored.map((preference) => [preference.type, preference.inAppEnabled]),
    );
    return ALL_NOTIFICATION_TYPES.map((type) => ({
      type,
      inAppEnabled: storedByType.get(type) ?? this.defaultEnabled(type),
    }));
  }

  async updatePreference(
    userId: string,
    type: NotificationType,
    inAppEnabled: boolean,
  ): Promise<NotificationPreferenceView[]> {
    await this.repository.upsertPreference(userId, type, inAppEnabled);
    return this.getPreferences(userId);
  }

  private async publishUnreadCount(userId: string): Promise<void> {
    const unreadCount = await this.repository.countUnread(userId);
    this.push.pushUnreadCount(userId, unreadCount);
  }

  private async isEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const stored = await this.repository.findPreference(userId, type);
    return stored ?? this.defaultEnabled(type);
  }

  private defaultEnabled(type: NotificationType): boolean {
    return !DEFAULT_DISABLED_TYPES.includes(type);
  }
}
