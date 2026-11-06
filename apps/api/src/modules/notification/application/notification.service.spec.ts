import { NotificationType } from '@prisma/client';
import { NotificationService } from './notification.service';
import { INotificationRepository } from '../domain/interfaces/notification-repository.interface';
import { Notification } from '../domain/entities/notification';
import { NotificationPreferenceView } from '../domain/read-models/notification-view';
import { RecordingRealtimePublisher } from '../../realtime/testing/recording-realtime.publisher';

class FakeNotificationRepository implements INotificationRepository {
  readonly created: Notification[] = [];
  private readonly preferences = new Map<string, boolean>();
  private readonly read = new Set<string>();

  async create(notification: Notification): Promise<boolean> {
    const key = notification.getDedupeKey();
    if (key !== null && this.created.some((existing) => existing.getDedupeKey() === key)) {
      return false;
    }
    this.created.push(notification);
    return true;
  }

  async listForUser(userId: string, limit: number): Promise<Notification[]> {
    return this.created
      .filter((notification) => notification.getUserId() === userId)
      .slice(0, limit);
  }

  async countUnread(userId: string): Promise<number> {
    return this.created.filter(
      (notification) => notification.getUserId() === userId && !this.read.has(notification.getId()),
    ).length;
  }

  async markRead(_userId: string, id: string): Promise<void> {
    this.read.add(id);
  }

  async markAllRead(userId: string): Promise<void> {
    for (const notification of this.created) {
      if (notification.getUserId() === userId) {
        this.read.add(notification.getId());
      }
    }
  }

  async listPreferences(userId: string): Promise<NotificationPreferenceView[]> {
    const views: NotificationPreferenceView[] = [];
    for (const [composite, inAppEnabled] of this.preferences.entries()) {
      const [storedUserId, type] = composite.split('::');
      if (storedUserId === userId) {
        views.push({ type: type as NotificationType, inAppEnabled });
      }
    }
    return views;
  }

  async findPreference(userId: string, type: NotificationType): Promise<boolean | null> {
    const value = this.preferences.get(`${userId}::${type}`);
    return value ?? null;
  }

  async upsertPreference(
    userId: string,
    type: NotificationType,
    inAppEnabled: boolean,
  ): Promise<void> {
    this.preferences.set(`${userId}::${type}`, inAppEnabled);
  }
}

describe('NotificationService', () => {
  let repository: FakeNotificationRepository;
  let realtime: RecordingRealtimePublisher;
  let service: NotificationService;

  beforeEach(() => {
    repository = new FakeNotificationRepository();
    realtime = new RecordingRealtimePublisher();
    service = new NotificationService(repository, realtime);
  });

  describe('realtime push', () => {
    it('pushes the created notification with the unread count to the recipient', async () => {
      await service.notify({
        userId: 'user-1',
        type: 'BADGE_AWARDED',
        title: 'Badge unlocked',
        body: 'You earned a badge.',
        linkUrl: '/dashboard/achievements',
      });
      expect(realtime.events).toHaveLength(1);
      const [pushed] = realtime.events;
      expect(pushed?.target).toBe('user');
      expect(pushed?.id).toBe('user-1');
      expect(pushed?.event).toBe('notification:new');
      expect(pushed?.payload).toEqual({
        notification: expect.objectContaining({
          id: repository.created[0]?.getId(),
          type: 'BADGE_AWARDED',
          title: 'Badge unlocked',
          isRead: false,
        }),
        unreadCount: 1,
      });
    });

    it('does not push when the preference is disabled or the notification is a duplicate', async () => {
      await service.updatePreference('user-1', 'FORUM_UPVOTE', false);
      await service.notify({
        userId: 'user-1',
        type: 'FORUM_UPVOTE',
        title: 'Upvote',
        body: 'b',
        linkUrl: null,
      });
      const draft = {
        userId: 'user-1',
        type: 'BADGE_AWARDED' as const,
        title: 'A',
        body: 'a',
        linkUrl: null,
        dedupeKey: 'badge:1',
      };
      await service.notify(draft);
      await service.notify(draft);
      expect(realtime.eventsNamed('notification:new')).toHaveLength(1);
    });

    it('pushes the new unread count after marking notifications read', async () => {
      await service.notify({ userId: 'user-1', type: 'FORUM_REPLY', title: 'A', body: 'a', linkUrl: null });
      await service.notify({ userId: 'user-1', type: 'FORUM_REPLY', title: 'B', body: 'b', linkUrl: null });
      const first = repository.created[0];
      await service.markRead('user-1', first?.getId() ?? '');
      await service.markAllRead('user-1');
      expect(
        realtime.eventsNamed('notification:unread-count').map((recorded) => recorded.payload),
      ).toEqual([{ unreadCount: 1 }, { unreadCount: 0 }]);
    });
  });

  describe('notify', () => {
    it('persists a notification for types enabled by default', async () => {
      await service.notify({
        userId: 'user-1',
        type: 'BADGE_AWARDED',
        title: 'Badge unlocked',
        body: 'You earned a badge.',
        linkUrl: '/dashboard/achievements',
      });
      expect(repository.created).toHaveLength(1);
      expect(repository.created[0]?.getType()).toBe('BADGE_AWARDED');
    });

    it('skips types disabled by default until explicitly enabled', async () => {
      await service.notify({
        userId: 'user-1',
        type: 'SUBMISSION_ACCEPTED',
        title: 'Solution accepted',
        body: 'Passed all tests.',
        linkUrl: '/dashboard/assessment/p1',
      });
      expect(repository.created).toHaveLength(0);

      await service.updatePreference('user-1', 'SUBMISSION_ACCEPTED', true);
      await service.notify({
        userId: 'user-1',
        type: 'SUBMISSION_ACCEPTED',
        title: 'Solution accepted',
        body: 'Passed all tests.',
        linkUrl: '/dashboard/assessment/p1',
      });
      expect(repository.created).toHaveLength(1);
    });

    it('skips a type the user has disabled', async () => {
      await service.updatePreference('user-1', 'FORUM_UPVOTE', false);
      await service.notify({
        userId: 'user-1',
        type: 'FORUM_UPVOTE',
        title: 'Upvote',
        body: 'Someone upvoted your post.',
        linkUrl: '/dashboard/forum/1',
      });
      expect(repository.created).toHaveLength(0);
    });
  });

  describe('listForUser', () => {
    it('returns notifications with the current unread count', async () => {
      await service.notify({
        userId: 'user-1',
        type: 'BADGE_AWARDED',
        title: 'A',
        body: 'a',
        linkUrl: null,
      });
      await service.notify({
        userId: 'user-1',
        type: 'FORUM_REPLY',
        title: 'B',
        body: 'b',
        linkUrl: null,
      });
      const view = await service.listForUser('user-1');
      expect(view.notifications).toHaveLength(2);
      expect(view.unreadCount).toBe(2);

      const first = view.notifications[0];
      expect(first).toBeDefined();
      await service.markRead('user-1', first!.getId());
      expect(await service.unreadCount('user-1')).toBe(1);

      await service.markAllRead('user-1');
      expect(await service.unreadCount('user-1')).toBe(0);
    });
  });

  describe('getPreferences', () => {
    it('returns every type with stored values overriding defaults', async () => {
      await service.updatePreference('user-1', 'SUBMISSION_ACCEPTED', true);
      const preferences = await service.getPreferences('user-1');
      expect(preferences).toHaveLength(14);

      const submission = preferences.find(
        (preference) => preference.type === 'SUBMISSION_ACCEPTED',
      );
      const badge = preferences.find((preference) => preference.type === 'BADGE_AWARDED');
      expect(submission?.inAppEnabled).toBe(true);
      expect(badge?.inAppEnabled).toBe(true);
    });
  });
});
