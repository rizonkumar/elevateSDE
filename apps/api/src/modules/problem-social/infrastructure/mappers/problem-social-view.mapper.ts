import { AssessmentDifficulty } from '@prisma/client';
import {
  BookmarkView,
  ProblemCollectionItemView,
  ProblemDiscussionCommentView,
  ProblemDiscussionView,
  ProblemSummaryView,
  SocialAuthorView,
} from '../../domain/read-models/problem-social-view';

interface AuthorRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
}

interface ProblemRecord {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  tags: string[];
  timeLimitMinutes: number;
}

interface DiscussionRecord {
  id: string;
  problemId: string;
  title: string;
  body: string;
  createdAt: Date;
  user: AuthorRecord;
  _count: { votes: number; comments: number };
}

interface CommentRecord {
  id: string;
  discussionId: string;
  body: string;
  createdAt: Date;
  user: AuthorRecord;
  _count: { votes: number };
}

interface BookmarkRecord {
  id: string;
  createdAt: Date;
  problem: ProblemRecord;
}

interface CollectionItemRecord {
  id: string;
  ordinal: number;
  problem: ProblemRecord;
}

export class ProblemSocialViewMapper {
  static toDiscussionView(
    record: DiscussionRecord,
    viewerHasUpvoted: boolean,
  ): ProblemDiscussionView {
    return {
      id: record.id,
      problemId: record.problemId,
      title: record.title,
      body: record.body,
      createdAt: record.createdAt,
      author: toAuthorView(record.user),
      upvotes: record._count.votes,
      replyCount: record._count.comments,
      viewerHasUpvoted,
    };
  }

  static toCommentView(
    record: CommentRecord,
    viewerHasUpvoted: boolean,
  ): ProblemDiscussionCommentView {
    return {
      id: record.id,
      discussionId: record.discussionId,
      body: record.body,
      createdAt: record.createdAt,
      author: toAuthorView(record.user),
      upvotes: record._count.votes,
      viewerHasUpvoted,
    };
  }

  static toBookmarkView(record: BookmarkRecord): BookmarkView {
    return {
      id: record.id,
      createdAt: record.createdAt,
      problem: toProblemSummaryView(record.problem),
    };
  }

  static toCollectionItemView(record: CollectionItemRecord): ProblemCollectionItemView {
    return {
      id: record.id,
      ordinal: record.ordinal,
      problem: toProblemSummaryView(record.problem),
    };
  }
}

function toAuthorView(record: AuthorRecord): SocialAuthorView {
  return {
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
    headline: record.headline,
  };
}

function toProblemSummaryView(record: ProblemRecord): ProblemSummaryView {
  return {
    id: record.id,
    title: record.title,
    difficulty: record.difficulty,
    tags: record.tags,
    timeLimitMinutes: record.timeLimitMinutes,
  };
}
