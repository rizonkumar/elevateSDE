import { ForumPostStatus } from '@prisma/client';

export interface ForumAuthorView {
  id: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
}

export interface ForumReportView {
  id: string;
  reason: string;
  createdAt: Date;
}

export interface ForumPostView {
  id: string;
  title: string;
  body: string;
  tags: string[];
  status: ForumPostStatus;
  viewCount: number;
  createdAt: Date;
  author: ForumAuthorView;
  authorEmail: string;
  upvotes: number;
  replyCount: number;
  reportCount: number;
  reports: ForumReportView[];
  viewerHasUpvoted: boolean;
}

export interface ForumCommentView {
  id: string;
  postId: string;
  body: string;
  createdAt: Date;
  author: ForumAuthorView;
  upvotes: number;
  viewerHasUpvoted: boolean;
}
