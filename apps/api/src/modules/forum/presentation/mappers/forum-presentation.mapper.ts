import {
  ForumAuthorView,
  ForumCommentView,
  ForumPostView,
  ForumReportView,
} from '../../domain/read-models/forum-view';
import { ForumAuthorResponseDto } from '../dtos/forum-author-response.dto';
import { ForumPostResponseDto } from '../dtos/forum-post-response.dto';
import { ForumCommentResponseDto } from '../dtos/forum-comment-response.dto';
import { AdminForumPostResponseDto } from '../dtos/admin-forum-post-response.dto';
import { ForumReportResponseDto } from '../dtos/forum-report-response.dto';

export class ForumPresentationMapper {
  static toPostResponse(view: ForumPostView): ForumPostResponseDto {
    const dto = new ForumPostResponseDto();
    dto.id = view.id;
    dto.title = view.title;
    dto.body = view.body;
    dto.tags = view.tags;
    dto.author = toAuthor(view.author);
    dto.upvotes = view.upvotes;
    dto.hasUpvoted = view.viewerHasUpvoted;
    dto.replyCount = view.replyCount;
    dto.viewCount = view.viewCount;
    dto.createdAt = view.createdAt.toISOString();
    return dto;
  }

  static toAdminPostResponse(view: ForumPostView): AdminForumPostResponseDto {
    const dto = new AdminForumPostResponseDto();
    dto.id = view.id;
    dto.title = view.title;
    dto.body = view.body;
    dto.tags = view.tags;
    dto.author = toAuthor(view.author);
    dto.authorEmail = view.authorEmail;
    dto.status = view.status;
    dto.upvotes = view.upvotes;
    dto.replyCount = view.replyCount;
    dto.viewCount = view.viewCount;
    dto.reportCount = view.reportCount;
    dto.reports = view.reports.map((report) => toReport(report));
    dto.createdAt = view.createdAt.toISOString();
    return dto;
  }

  static toCommentResponse(view: ForumCommentView): ForumCommentResponseDto {
    const dto = new ForumCommentResponseDto();
    dto.id = view.id;
    dto.postId = view.postId;
    dto.author = toAuthor(view.author);
    dto.body = view.body;
    dto.upvotes = view.upvotes;
    dto.hasUpvoted = view.viewerHasUpvoted;
    dto.createdAt = view.createdAt.toISOString();
    return dto;
  }
}

function toAuthor(author: ForumAuthorView): ForumAuthorResponseDto {
  const dto = new ForumAuthorResponseDto();
  dto.id = author.id;
  dto.name = buildName(author.firstName, author.lastName);
  dto.headline = author.headline;
  return dto;
}

function toReport(report: ForumReportView): ForumReportResponseDto {
  const dto = new ForumReportResponseDto();
  dto.id = report.id;
  dto.reason = report.reason;
  dto.createdAt = report.createdAt.toISOString();
  return dto;
}

function buildName(firstName: string | null, lastName: string | null): string {
  const name = [firstName, lastName].filter((part) => part && part.trim().length > 0).join(' ');
  return name.length > 0 ? name : 'Member';
}
