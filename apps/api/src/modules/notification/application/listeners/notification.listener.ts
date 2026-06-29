import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationDraft } from '../../domain/entities/notification';
import {
  BadgeAwardedEvent,
  ForumReplyEvent,
  ForumUpvoteEvent,
  NOTIFICATION_EVENTS,
  StreakMilestoneEvent,
  SubmissionAcceptedEvent,
} from '../../domain/events/notification-events';
import { NotificationService } from '../notification.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(NOTIFICATION_EVENTS.BADGE_AWARDED)
  async onBadgeAwarded(event: BadgeAwardedEvent): Promise<void> {
    await this.safeNotify({
      userId: event.userId,
      type: 'BADGE_AWARDED',
      title: 'Badge unlocked',
      body: `You earned the "${event.badgeName}" badge.`,
      linkUrl: '/dashboard/achievements',
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.STREAK_MILESTONE)
  async onStreakMilestone(event: StreakMilestoneEvent): Promise<void> {
    await this.safeNotify({
      userId: event.userId,
      type: 'STREAK_MILESTONE',
      title: `${event.streakDays}-day streak!`,
      body: `You have kept your daily streak alive for ${event.streakDays} days. Keep it going!`,
      linkUrl: '/dashboard/daily',
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.FORUM_REPLY)
  async onForumReply(event: ForumReplyEvent): Promise<void> {
    await this.safeNotify({
      userId: event.recipientId,
      type: 'FORUM_REPLY',
      title: 'New reply',
      body: `Someone replied to your post "${event.postTitle}".`,
      linkUrl: `/dashboard/forum/${event.postId}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.FORUM_UPVOTE)
  async onForumUpvote(event: ForumUpvoteEvent): Promise<void> {
    await this.safeNotify({
      userId: event.recipientId,
      type: 'FORUM_UPVOTE',
      title: 'Your post got an upvote',
      body: `Someone upvoted your post "${event.postTitle}".`,
      linkUrl: `/dashboard/forum/${event.postId}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SUBMISSION_ACCEPTED)
  async onSubmissionAccepted(event: SubmissionAcceptedEvent): Promise<void> {
    await this.safeNotify({
      userId: event.userId,
      type: 'SUBMISSION_ACCEPTED',
      title: 'Solution accepted',
      body: 'Your submission passed all test cases.',
      linkUrl: `/dashboard/assessment/${event.problemId}`,
    });
  }

  private async safeNotify(draft: NotificationDraft): Promise<void> {
    try {
      await this.notificationService.notify(draft);
    } catch (error) {
      this.logger.error(`Failed to create ${draft.type} notification`, error instanceof Error ? error.stack : undefined);
    }
  }
}
