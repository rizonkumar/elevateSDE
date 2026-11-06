import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationDraft } from '../../domain/entities/notification';
import {
  AccountPendingApprovalEvent,
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
  CodeReviewReadyEvent,
  ContestRatingUpdatedEvent,
  StudyGoalCompletedEvent,
  StudyGroupAddedEvent,
} from '../../domain/events/notification-events';
import { NotificationService } from '../notification.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(NOTIFICATION_EVENTS.ACCOUNT_PENDING_APPROVAL)
  async onAccountPendingApproval(event: AccountPendingApprovalEvent): Promise<void> {
    await Promise.all(
      event.recipientIds.map((recipientId) =>
        this.safeNotify({
          userId: recipientId,
          type: 'SYSTEM',
          title: 'New account awaiting approval',
          body: `${event.email} signed up and is waiting for your approval.`,
          linkUrl: '/admin/users?tab=pending',
          dedupeKey: `account-pending:${event.pendingUserId}:${recipientId}`,
        }),
      ),
    );
  }

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

  @OnEvent(NOTIFICATION_EVENTS.CODE_REVIEW_READY)
  async onCodeReviewReady(event: CodeReviewReadyEvent): Promise<void> {
    await this.safeNotify({
      userId: event.userId,
      type: 'CODE_REVIEW_READY',
      title: 'Your code review is ready',
      body: `See the feedback on your ${event.problemTitle} submission.`,
      linkUrl: `/dashboard/assessment/${event.problemId}`,
      dedupeKey: `code-review:${event.submissionId}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.CONTEST_RATING_UPDATED)
  async onContestRatingUpdated(event: ContestRatingUpdatedEvent): Promise<void> {
    const sign = event.delta >= 0 ? '+' : '−';
    await this.safeNotify({
      userId: event.userId,
      type: 'CONTEST_RATING_UPDATED',
      title: 'Your contest rating changed',
      body: `${event.contestTitle}: ${event.oldRating} → ${event.newRating} (${sign}${Math.abs(event.delta)})`,
      linkUrl: `/dashboard/contests/${event.contestSlug}/standings`,
      dedupeKey: `rating:${event.contestId}:${event.userId}`,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.STUDY_GROUP_ADDED)
  async onStudyGroupAdded(event: StudyGroupAddedEvent): Promise<void> {
    await this.safeNotify({
      userId: event.recipientId,
      type: 'STUDY_GROUP_ADDED',
      title: `You joined ${event.groupName}`,
      body: `${event.actorName} added you to the study group ${event.groupName}.`,
      linkUrl: `/dashboard/groups/${event.groupId}`,
      dedupeKey: event.dedupeKey,
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.STUDY_GOAL_COMPLETED)
  async onStudyGoalCompleted(event: StudyGoalCompletedEvent): Promise<void> {
    await this.safeNotify({
      userId: event.recipientId,
      type: 'STUDY_GOAL_COMPLETED',
      title: event.personal ? 'You reached a group goal' : 'Your group reached its goal',
      body: event.personal
        ? `You hit the target for "${event.goalTitle}" in ${event.groupName}.`
        : `${event.groupName} completed "${event.goalTitle}".`,
      linkUrl: `/dashboard/groups/${event.groupId}`,
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
