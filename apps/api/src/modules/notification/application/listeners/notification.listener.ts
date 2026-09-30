import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationDraft } from '../../domain/entities/notification';
import {
  BadgeAwardedEvent,
  ForumReplyEvent,
  ForumUpvoteEvent,
  NOTIFICATION_EVENTS,
  PeerInvitationEvent,
  PeerSessionChangedEvent,
  PreparationReminderEvent,
  ScorecardRequestEvent,
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

  @OnEvent(NOTIFICATION_EVENTS.PREPARATION_REMINDER)
  async onPreparationReminder(event: PreparationReminderEvent): Promise<void> {
    await this.safeNotify({
      userId: event.recipientId,
      type: 'PREPARATION_REMINDER',
      title: `Prepare for ${event.company}`,
      body: 'Your interview is approaching. Review the highest-priority gaps in your plan.',
      linkUrl: `/dashboard/interview-readiness/${event.planId}`,
      dedupeKey: event.dedupeKey,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PEER_INVITATION)
  async onPeerInvitation(event: PeerInvitationEvent): Promise<void> {
    await this.safeNotify({
      userId: event.recipientId,
      type: 'PEER_INVITATION',
      title: 'Peer practice invitation',
      body: `${event.organizerName} invited you to an interview practice session.`,
      linkUrl: `/dashboard/interview-readiness/peer/${event.sessionId}`,
      dedupeKey: `peer-invite:${event.sessionId}:${event.recipientId}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.PEER_SESSION_CHANGED)
  async onPeerSessionChanged(event: PeerSessionChangedEvent): Promise<void> {
    await this.safeNotify({
      userId: event.recipientId,
      type: 'PEER_SESSION_CHANGED',
      title: 'Peer session updated',
      body: `The session is now ${event.status.toLowerCase().replaceAll('_', ' ')}.`,
      linkUrl: `/dashboard/interview-readiness/peer/${event.sessionId}`,
      dedupeKey: event.dedupeKey,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.SCORECARD_REQUEST)
  async onScorecardRequest(event: ScorecardRequestEvent): Promise<void> {
    await this.safeNotify({
      userId: event.recipientId,
      type: 'SCORECARD_REQUEST',
      title: 'Share peer feedback',
      body: 'Your practice session is complete. Submit a scorecard while the conversation is fresh.',
      linkUrl: `/dashboard/interview-readiness/peer/${event.sessionId}`,
      dedupeKey: event.dedupeKey,
    });
  }

  private async safeNotify(draft: NotificationDraft): Promise<void> {
    try {
      await this.notificationService.notify(draft);
    } catch (error) {
      this.logger.error(
        `Failed to create ${draft.type} notification`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
