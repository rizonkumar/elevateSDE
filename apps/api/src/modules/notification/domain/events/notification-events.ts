export const NOTIFICATION_EVENTS = {
  BADGE_AWARDED: 'notification.badge-awarded',
  STREAK_MILESTONE: 'notification.streak-milestone',
  FORUM_REPLY: 'notification.forum-reply',
  FORUM_UPVOTE: 'notification.forum-upvote',
  SUBMISSION_ACCEPTED: 'notification.submission-accepted',
  PREPARATION_REMINDER: 'notification.preparation-reminder',
  PEER_INVITATION: 'notification.peer-invitation',
  PEER_SESSION_CHANGED: 'notification.peer-session-changed',
  SCORECARD_REQUEST: 'notification.scorecard-request',
  CODE_REVIEW_READY: 'notification.code-review-ready',
  ACCOUNT_PENDING_APPROVAL: 'notification.account-pending-approval',
} as const;

export interface AccountPendingApprovalEvent {
  recipientIds: string[];
  pendingUserId: string;
  email: string;
}

export interface BadgeAwardedEvent {
  userId: string;
  badgeName: string;
}

export interface StreakMilestoneEvent {
  userId: string;
  streakDays: number;
}

export interface ForumReplyEvent {
  recipientId: string;
  actorId: string;
  postId: string;
  postTitle: string;
}

export interface ForumUpvoteEvent {
  recipientId: string;
  actorId: string;
  postId: string;
  postTitle: string;
}

export interface SubmissionAcceptedEvent {
  userId: string;
  problemId: string;
}

export interface PreparationReminderEvent {
  recipientId: string;
  planId: string;
  company: string;
  dedupeKey: string;
}

export interface PeerInvitationEvent {
  recipientId: string;
  planId: string;
  sessionId: string;
  organizerName: string;
}

export interface PeerSessionChangedEvent {
  recipientId: string;
  planId: string;
  sessionId: string;
  status: string;
  dedupeKey: string;
}

export interface CodeReviewReadyEvent {
  userId: string;
  problemId: string;
  problemTitle: string;
  submissionId: string;
}

export interface ScorecardRequestEvent {
  recipientId: string;
  planId: string;
  sessionId: string;
  dedupeKey: string;
}
