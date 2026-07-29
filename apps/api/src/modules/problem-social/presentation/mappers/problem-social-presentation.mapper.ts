import { ForumAuthorResponseDto } from '../../../forum/presentation/dtos/forum-author-response.dto';
import { ProblemSummaryResponseDto } from '../../../problem/presentation/dtos/problem-summary-response.dto';
import { PublicCollectionPage } from '../../domain/interfaces/problem-social-repository.interface';
import {
  BookmarkView,
  ProblemCollectionItemView,
  ProblemCollectionView,
  ProblemDiscussionCommentView,
  ProblemDiscussionView,
  ProblemNoteView,
  ProblemSummaryView,
  PublicCollectionSummaryView,
  SocialAuthorView,
} from '../../domain/read-models/problem-social-view';
import { PublicCollectionDetailResult } from '../../application/problem-social.service';
import { ProblemDiscussionResponseDto } from '../dtos/problem-discussion-response.dto';
import { ProblemDiscussionCommentResponseDto } from '../dtos/problem-discussion-comment-response.dto';
import { BookmarkResponseDto } from '../dtos/bookmark-response.dto';
import { ProblemNoteResponseDto } from '../dtos/problem-note-response.dto';
import { ProblemCollectionResponseDto } from '../dtos/problem-collection-response.dto';
import { ProblemCollectionItemResponseDto } from '../dtos/problem-collection-item-response.dto';
import { PublicCollectionSummaryResponseDto } from '../dtos/public-collection-summary-response.dto';
import { PublicCollectionListResponseDto } from '../dtos/public-collection-list-response.dto';
import { PublicCollectionDetailResponseDto } from '../dtos/public-collection-detail-response.dto';

export class ProblemSocialPresentationMapper {
  static toDiscussionResponse(view: ProblemDiscussionView): ProblemDiscussionResponseDto {
    const dto = new ProblemDiscussionResponseDto();
    dto.id = view.id;
    dto.problemId = view.problemId;
    dto.title = view.title;
    dto.body = view.body;
    dto.author = toAuthor(view.author);
    dto.upvotes = view.upvotes;
    dto.hasUpvoted = view.viewerHasUpvoted;
    dto.replyCount = view.replyCount;
    dto.createdAt = view.createdAt.toISOString();
    return dto;
  }

  static toCommentResponse(
    view: ProblemDiscussionCommentView,
  ): ProblemDiscussionCommentResponseDto {
    const dto = new ProblemDiscussionCommentResponseDto();
    dto.id = view.id;
    dto.discussionId = view.discussionId;
    dto.author = toAuthor(view.author);
    dto.body = view.body;
    dto.upvotes = view.upvotes;
    dto.hasUpvoted = view.viewerHasUpvoted;
    dto.createdAt = view.createdAt.toISOString();
    return dto;
  }

  static toBookmarkResponse(view: BookmarkView): BookmarkResponseDto {
    const dto = new BookmarkResponseDto();
    dto.id = view.id;
    dto.problem = toProblemSummary(view.problem);
    dto.createdAt = view.createdAt.toISOString();
    return dto;
  }

  static toNoteResponse(view: ProblemNoteView): ProblemNoteResponseDto {
    const dto = new ProblemNoteResponseDto();
    dto.problemId = view.problemId;
    dto.body = view.body;
    dto.updatedAt = view.updatedAt.toISOString();
    return dto;
  }

  static toCollectionResponse(view: ProblemCollectionView): ProblemCollectionResponseDto {
    const dto = new ProblemCollectionResponseDto();
    dto.id = view.id;
    dto.name = view.name;
    dto.isPublic = view.isPublic;
    dto.itemCount = view.itemCount;
    dto.items = view.items.map((item) => toCollectionItem(item));
    dto.createdAt = view.createdAt.toISOString();
    return dto;
  }

  static toPublicCollectionSummaryResponse(
    view: PublicCollectionSummaryView,
  ): PublicCollectionSummaryResponseDto {
    const dto = new PublicCollectionSummaryResponseDto();
    dto.id = view.id;
    dto.name = view.name;
    dto.itemCount = view.itemCount;
    dto.createdAt = view.createdAt.toISOString();
    dto.author = toAuthor(view.author);
    return dto;
  }

  static toPublicCollectionListResponse(
    page: PublicCollectionPage,
    pageNumber: number,
    pageSize: number,
  ): PublicCollectionListResponseDto {
    const dto = new PublicCollectionListResponseDto();
    dto.items = page.items.map((item) => this.toPublicCollectionSummaryResponse(item));
    dto.total = page.total;
    dto.page = pageNumber;
    dto.pageSize = pageSize;
    return dto;
  }

  static toPublicCollectionDetailResponse(
    detail: PublicCollectionDetailResult,
  ): PublicCollectionDetailResponseDto {
    const dto = new PublicCollectionDetailResponseDto();
    dto.id = detail.id;
    dto.name = detail.name;
    dto.itemCount = detail.itemCount;
    dto.createdAt = detail.createdAt.toISOString();
    dto.author = toAuthor(detail.author);
    dto.items = detail.items.map((item) => toCollectionItem(item));
    dto.viewerSolvedProblemIds = detail.viewerSolvedProblemIds;
    return dto;
  }
}

function toCollectionItem(view: ProblemCollectionItemView): ProblemCollectionItemResponseDto {
  const dto = new ProblemCollectionItemResponseDto();
  dto.id = view.id;
  dto.ordinal = view.ordinal;
  dto.problem = toProblemSummary(view.problem);
  return dto;
}

function toProblemSummary(view: ProblemSummaryView): ProblemSummaryResponseDto {
  const dto = new ProblemSummaryResponseDto();
  dto.id = view.id;
  dto.title = view.title;
  dto.difficulty = view.difficulty;
  dto.tags = view.tags;
  dto.timeLimitMinutes = view.timeLimitMinutes;
  return dto;
}

function toAuthor(author: SocialAuthorView): ForumAuthorResponseDto {
  const dto = new ForumAuthorResponseDto();
  dto.id = author.id;
  dto.handle = author.handle;
  dto.name = buildName(author.firstName, author.lastName);
  dto.headline = author.headline;
  return dto;
}

function buildName(firstName: string | null, lastName: string | null): string {
  const name = [firstName, lastName].filter((part) => part && part.trim().length > 0).join(' ');
  return name.length > 0 ? name : 'Member';
}
