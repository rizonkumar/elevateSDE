export const NOTIFICATION_EVENTS = {
  BADGE_AWARDED: 'notification.badge-awarded',
  STREAK_MILESTONE: 'notification.streak-milestone',
  FORUM_REPLY: 'notification.forum-reply',
  FORUM_UPVOTE: 'notification.forum-upvote',
  SUBMISSION_ACCEPTED: 'notification.submission-accepted',
} as const;

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
