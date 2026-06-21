import { ForumPostStatus } from '@prisma/client';
import {
  ForumAuthorView,
  ForumCommentView,
  ForumPostView,
  ForumReportView,
} from '../../domain/read-models/forum-view';

interface AuthorRecord {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
}

interface ReportRecord {
  id: string;
  reason: string;
  createdAt: Date;
}

interface PostRecord {
  id: string;
  title: string;
  body: string;
  tags: string[];
  status: ForumPostStatus;
  viewCount: number;
  createdAt: Date;
  user: AuthorRecord;
  reports?: ReportRecord[];
  _count: { comments: number; votes: number; reports?: number };
}

interface CommentRecord {
  id: string;
  postId: string;
  body: string;
  createdAt: Date;
  user: AuthorRecord;
  _count: { votes: number };
}

export class ForumViewMapper {
  static toPostView(record: PostRecord, viewerHasUpvoted: boolean): ForumPostView {
    const reports = (record.reports ?? []).map((report) => toReportView(report));
    return {
      id: record.id,
      title: record.title,
      body: record.body,
      tags: record.tags,
      status: record.status,
      viewCount: record.viewCount,
      createdAt: record.createdAt,
      author: toAuthorView(record.user),
      authorEmail: record.user.email,
      upvotes: record._count.votes,
      replyCount: record._count.comments,
      reportCount: record._count.reports ?? reports.length,
      reports,
      viewerHasUpvoted,
    };
  }

  static toCommentView(record: CommentRecord, viewerHasUpvoted: boolean): ForumCommentView {
    return {
      id: record.id,
      postId: record.postId,
      body: record.body,
      createdAt: record.createdAt,
      author: toAuthorView(record.user),
      upvotes: record._count.votes,
      viewerHasUpvoted,
    };
  }
}

function toAuthorView(record: AuthorRecord): ForumAuthorView {
  return {
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
    headline: record.headline,
  };
}

function toReportView(record: ReportRecord): ForumReportView {
  return {
    id: record.id,
    reason: record.reason,
    createdAt: record.createdAt,
  };
}
