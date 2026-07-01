import { AssessmentDifficulty } from '@prisma/client';

export interface SocialAuthorView {
  id: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
}

export interface ProblemSummaryView {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  tags: string[];
  timeLimitMinutes: number;
}

export interface ProblemDiscussionView {
  id: string;
  problemId: string;
  title: string;
  body: string;
  createdAt: Date;
  author: SocialAuthorView;
  upvotes: number;
  replyCount: number;
  viewerHasUpvoted: boolean;
}

export interface ProblemDiscussionCommentView {
  id: string;
  discussionId: string;
  body: string;
  createdAt: Date;
  author: SocialAuthorView;
  upvotes: number;
  viewerHasUpvoted: boolean;
}

export interface BookmarkView {
  id: string;
  createdAt: Date;
  problem: ProblemSummaryView;
}

export interface ProblemNoteView {
  problemId: string;
  body: string;
  updatedAt: Date;
}

export interface ProblemCollectionItemView {
  id: string;
  ordinal: number;
  problem: ProblemSummaryView;
}

export interface ProblemCollectionView {
  id: string;
  name: string;
  isPublic: boolean;
  itemCount: number;
  items: ProblemCollectionItemView[];
  createdAt: Date;
}
