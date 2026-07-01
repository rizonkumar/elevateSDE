import { Injectable } from '@nestjs/common';
import { AssessmentDifficulty } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IProblemSocialRepository } from '../../domain/interfaces/problem-social-repository.interface';
import { ProblemDiscussion } from '../../domain/entities/problem-discussion';
import { ProblemDiscussionComment } from '../../domain/entities/problem-discussion-comment';
import { ProblemList } from '../../domain/entities/problem-list';
import {
  BookmarkView,
  ProblemCollectionView,
  ProblemDiscussionCommentView,
  ProblemDiscussionView,
  ProblemNoteView,
} from '../../domain/read-models/problem-social-view';
import { ProblemSocialMapper } from '../mappers/problem-social.mapper';
import { ProblemSocialViewMapper } from '../mappers/problem-social-view.mapper';

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  headline: true,
} as const;

const problemSummarySelect = {
  id: true,
  title: true,
  difficulty: true,
  tags: true,
  timeLimitMinutes: true,
} as const;

@Injectable()
export class ProblemSocialRepository implements IProblemSocialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async problemExists(problemId: string): Promise<boolean> {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true },
    });
    return problem !== null;
  }

  async listDiscussions(problemId: string, viewerId: string): Promise<ProblemDiscussionView[]> {
    const records = await this.prisma.problemDiscussion.findMany({
      where: { problemId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: authorSelect },
        _count: { select: { votes: true, comments: true } },
      },
    });
    const votedIds = await this.votedDiscussionIds(
      viewerId,
      records.map((record) => record.id),
    );
    return records.map((record) =>
      ProblemSocialViewMapper.toDiscussionView(record, votedIds.has(record.id)),
    );
  }

  async findDiscussionById(id: string): Promise<ProblemDiscussion | null> {
    const record = await this.prisma.problemDiscussion.findUnique({ where: { id } });
    if (!record) {
      return null;
    }
    return ProblemSocialMapper.toDomainDiscussion(record);
  }

  async findDiscussionView(id: string, viewerId: string): Promise<ProblemDiscussionView | null> {
    const record = await this.prisma.problemDiscussion.findUnique({
      where: { id },
      include: {
        user: { select: authorSelect },
        _count: { select: { votes: true, comments: true } },
      },
    });
    if (!record) {
      return null;
    }
    const vote = await this.prisma.problemDiscussionVote.findUnique({
      where: { discussionId_userId: { discussionId: id, userId: viewerId } },
    });
    return ProblemSocialViewMapper.toDiscussionView(record, vote !== null);
  }

  async createDiscussion(discussion: ProblemDiscussion): Promise<void> {
    await this.prisma.problemDiscussion.create({
      data: ProblemSocialMapper.toDiscussionPersistence(discussion),
    });
  }

  async toggleDiscussionVote(discussionId: string, userId: string): Promise<void> {
    const existing = await this.prisma.problemDiscussionVote.findUnique({
      where: { discussionId_userId: { discussionId, userId } },
    });
    await applyToggle(
      existing,
      () =>
        this.prisma.problemDiscussionVote.delete({
          where: { discussionId_userId: { discussionId, userId } },
        }),
      () => this.prisma.problemDiscussionVote.create({ data: { discussionId, userId } }),
    );
  }

  async listComments(
    discussionId: string,
    viewerId: string,
  ): Promise<ProblemDiscussionCommentView[]> {
    const records = await this.prisma.problemDiscussionComment.findMany({
      where: { discussionId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: authorSelect }, _count: { select: { votes: true } } },
    });
    const votedIds = await this.votedCommentIds(
      viewerId,
      records.map((record) => record.id),
    );
    return records.map((record) =>
      ProblemSocialViewMapper.toCommentView(record, votedIds.has(record.id)),
    );
  }

  async findCommentById(id: string): Promise<ProblemDiscussionComment | null> {
    const record = await this.prisma.problemDiscussionComment.findUnique({ where: { id } });
    if (!record) {
      return null;
    }
    return ProblemSocialMapper.toDomainComment(record);
  }

  async findCommentView(
    id: string,
    viewerId: string,
  ): Promise<ProblemDiscussionCommentView | null> {
    const record = await this.prisma.problemDiscussionComment.findUnique({
      where: { id },
      include: { user: { select: authorSelect }, _count: { select: { votes: true } } },
    });
    if (!record) {
      return null;
    }
    const vote = await this.prisma.problemDiscussionCommentVote.findUnique({
      where: { commentId_userId: { commentId: id, userId: viewerId } },
    });
    return ProblemSocialViewMapper.toCommentView(record, vote !== null);
  }

  async createComment(comment: ProblemDiscussionComment): Promise<void> {
    await this.prisma.problemDiscussionComment.create({
      data: ProblemSocialMapper.toCommentPersistence(comment),
    });
  }

  async toggleCommentVote(commentId: string, userId: string): Promise<void> {
    const existing = await this.prisma.problemDiscussionCommentVote.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
    await applyToggle(
      existing,
      () =>
        this.prisma.problemDiscussionCommentVote.delete({
          where: { commentId_userId: { commentId, userId } },
        }),
      () => this.prisma.problemDiscussionCommentVote.create({ data: { commentId, userId } }),
    );
  }

  async toggleBookmark(userId: string, problemId: string): Promise<boolean> {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    if (existing) {
      await this.prisma.bookmark.delete({
        where: { userId_problemId: { userId, problemId } },
      });
      return false;
    }
    await this.prisma.bookmark.create({ data: { userId, problemId } });
    return true;
  }

  async listBookmarks(userId: string): Promise<BookmarkView[]> {
    const records = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { problem: { select: problemSummarySelect } },
    });
    return records.map((record) => ProblemSocialViewMapper.toBookmarkView(record));
  }

  async findNote(userId: string, problemId: string): Promise<ProblemNoteView | null> {
    const record = await this.prisma.problemNote.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    if (!record) {
      return null;
    }
    return toNoteView(record);
  }

  async upsertNote(userId: string, problemId: string, body: string): Promise<ProblemNoteView> {
    const record = await this.prisma.problemNote.upsert({
      where: { userId_problemId: { userId, problemId } },
      create: { userId, problemId, body },
      update: { body },
    });
    return toNoteView(record);
  }

  async listCollections(userId: string): Promise<ProblemCollectionView[]> {
    const records = await this.prisma.problemList.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { ordinal: 'asc' },
          include: { problem: { select: problemSummarySelect } },
        },
      },
    });
    return records.map((record) => toCollectionView(record));
  }

  async findCollectionById(id: string): Promise<ProblemList | null> {
    const record = await this.prisma.problemList.findUnique({ where: { id } });
    if (!record) {
      return null;
    }
    return ProblemSocialMapper.toDomainList(record);
  }

  async findCollectionView(id: string): Promise<ProblemCollectionView | null> {
    const record = await this.prisma.problemList.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { ordinal: 'asc' },
          include: { problem: { select: problemSummarySelect } },
        },
      },
    });
    if (!record) {
      return null;
    }
    return toCollectionView(record);
  }

  async createCollection(list: ProblemList): Promise<void> {
    await this.prisma.problemList.create({
      data: ProblemSocialMapper.toListPersistence(list),
    });
  }

  async updateCollection(list: ProblemList): Promise<void> {
    await this.prisma.problemList.update({
      where: { id: list.getId() },
      data: { name: list.getName(), isPublic: list.getIsPublic() },
    });
  }

  async deleteCollection(id: string): Promise<void> {
    await this.prisma.problemList.delete({ where: { id } });
  }

  async addCollectionItem(listId: string, problemId: string): Promise<void> {
    const nextOrdinal = await this.prisma.problemListItem.count({ where: { listId } });
    await this.prisma.problemListItem.create({
      data: { listId, problemId, ordinal: nextOrdinal },
    });
  }

  async removeCollectionItem(listId: string, problemId: string): Promise<void> {
    await this.prisma.problemListItem.deleteMany({ where: { listId, problemId } });
  }

  async listCollectionProblemIds(listId: string): Promise<string[]> {
    const items = await this.prisma.problemListItem.findMany({
      where: { listId },
      orderBy: { ordinal: 'asc' },
      select: { problemId: true },
    });
    return items.map((item) => item.problemId);
  }

  async reorderCollection(listId: string, orderedProblemIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedProblemIds.map((problemId, index) =>
        this.prisma.problemListItem.updateMany({
          where: { listId, problemId },
          data: { ordinal: index },
        }),
      ),
    );
  }

  private async votedDiscussionIds(viewerId: string, ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) {
      return new Set();
    }
    const votes = await this.prisma.problemDiscussionVote.findMany({
      where: { userId: viewerId, discussionId: { in: ids } },
      select: { discussionId: true },
    });
    return new Set(votes.map((vote) => vote.discussionId));
  }

  private async votedCommentIds(viewerId: string, ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) {
      return new Set();
    }
    const votes = await this.prisma.problemDiscussionCommentVote.findMany({
      where: { userId: viewerId, commentId: { in: ids } },
      select: { commentId: true },
    });
    return new Set(votes.map((vote) => vote.commentId));
  }
}

async function applyToggle(
  existing: unknown,
  onDelete: () => Promise<unknown>,
  onCreate: () => Promise<unknown>,
): Promise<void> {
  if (existing) {
    await onDelete();
    return;
  }
  await onCreate();
}

interface NoteRecord {
  problemId: string;
  body: string;
  updatedAt: Date;
}

function toNoteView(record: NoteRecord): ProblemNoteView {
  return {
    problemId: record.problemId,
    body: record.body,
    updatedAt: record.updatedAt,
  };
}

interface CollectionRecord {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: Date;
  items: Array<{
    id: string;
    ordinal: number;
    problem: {
      id: string;
      title: string;
      difficulty: AssessmentDifficulty;
      tags: string[];
      timeLimitMinutes: number;
    };
  }>;
}

function toCollectionView(record: CollectionRecord): ProblemCollectionView {
  const items = record.items.map((item) => ProblemSocialViewMapper.toCollectionItemView(item));
  return {
    id: record.id,
    name: record.name,
    isPublic: record.isPublic,
    itemCount: items.length,
    items,
    createdAt: record.createdAt,
  };
}
