import { Injectable } from '@nestjs/common';
import { ForumPostStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IForumRepository } from '../../domain/interfaces/forum-repository.interface';
import { ForumPost } from '../../domain/entities/forum-post';
import { ForumComment } from '../../domain/entities/forum-comment';
import { ForumCommentView, ForumPostView } from '../../domain/read-models/forum-view';
import { ForumMapper } from '../mappers/forum.mapper';
import { ForumViewMapper } from '../mappers/forum-view.mapper';

const authorSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  headline: true,
} as const;

@Injectable()
export class ForumRepository implements IForumRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(viewerId: string): Promise<ForumPostView[]> {
    const records = await this.prisma.forumPost.findMany({
      where: { status: ForumPostStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: authorSelect }, _count: { select: { comments: true, votes: true } } },
    });
    const votedIds = await this.votedPostIds(
      viewerId,
      records.map((record) => record.id),
    );
    return records.map((record) => ForumViewMapper.toPostView(record, votedIds.has(record.id)));
  }

  async listAll(viewerId: string): Promise<ForumPostView[]> {
    const records = await this.prisma.forumPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: authorSelect },
        reports: { orderBy: { createdAt: 'desc' } },
        _count: { select: { comments: true, votes: true, reports: true } },
      },
    });
    const votedIds = await this.votedPostIds(
      viewerId,
      records.map((record) => record.id),
    );
    return records.map((record) => ForumViewMapper.toPostView(record, votedIds.has(record.id)));
  }

  async findPostById(id: string): Promise<ForumPost | null> {
    const record = await this.prisma.forumPost.findUnique({ where: { id } });
    if (!record) {
      return null;
    }
    return ForumMapper.toDomainPost(record);
  }

  async findPostView(id: string, viewerId: string): Promise<ForumPostView | null> {
    const record = await this.prisma.forumPost.findUnique({
      where: { id },
      include: {
        user: { select: authorSelect },
        reports: { orderBy: { createdAt: 'desc' } },
        _count: { select: { comments: true, votes: true, reports: true } },
      },
    });
    if (!record) {
      return null;
    }
    const vote = await this.prisma.forumPostVote.findUnique({
      where: { postId_userId: { postId: id, userId: viewerId } },
    });
    return ForumViewMapper.toPostView(record, vote !== null);
  }

  async createPost(post: ForumPost): Promise<void> {
    const data = ForumMapper.toPostPersistence(post);
    await this.prisma.forumPost.create({ data });
  }

  async updatePostStatus(id: string, status: ForumPostStatus): Promise<void> {
    await this.prisma.forumPost.update({ where: { id }, data: { status } });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.forumPost.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  }

  async togglePostVote(postId: string, userId: string): Promise<void> {
    const existing = await this.prisma.forumPostVote.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await this.prisma.forumPostVote.delete({ where: { postId_userId: { postId, userId } } });
      return;
    }
    await this.prisma.forumPostVote.create({ data: { postId, userId } });
  }

  async createReport(postId: string, reporterId: string, reason: string): Promise<void> {
    await this.prisma.forumReport.create({ data: { postId, reporterId, reason } });
  }

  async listComments(postId: string, viewerId: string): Promise<ForumCommentView[]> {
    const records = await this.prisma.forumComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: authorSelect }, _count: { select: { votes: true } } },
    });
    const votedIds = await this.votedCommentIds(
      viewerId,
      records.map((record) => record.id),
    );
    return records.map((record) => ForumViewMapper.toCommentView(record, votedIds.has(record.id)));
  }

  async findCommentById(id: string): Promise<ForumComment | null> {
    const record = await this.prisma.forumComment.findUnique({ where: { id } });
    if (!record) {
      return null;
    }
    return ForumMapper.toDomainComment(record);
  }

  async findCommentView(id: string, viewerId: string): Promise<ForumCommentView | null> {
    const record = await this.prisma.forumComment.findUnique({
      where: { id },
      include: { user: { select: authorSelect }, _count: { select: { votes: true } } },
    });
    if (!record) {
      return null;
    }
    const vote = await this.prisma.forumCommentVote.findUnique({
      where: { commentId_userId: { commentId: id, userId: viewerId } },
    });
    return ForumViewMapper.toCommentView(record, vote !== null);
  }

  async createComment(comment: ForumComment): Promise<void> {
    const data = ForumMapper.toCommentPersistence(comment);
    await this.prisma.forumComment.create({ data });
  }

  async toggleCommentVote(commentId: string, userId: string): Promise<void> {
    const existing = await this.prisma.forumCommentVote.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
    if (existing) {
      await this.prisma.forumCommentVote.delete({
        where: { commentId_userId: { commentId, userId } },
      });
      return;
    }
    await this.prisma.forumCommentVote.create({ data: { commentId, userId } });
  }

  private async votedPostIds(viewerId: string, postIds: string[]): Promise<Set<string>> {
    if (postIds.length === 0) {
      return new Set();
    }
    const votes = await this.prisma.forumPostVote.findMany({
      where: { userId: viewerId, postId: { in: postIds } },
      select: { postId: true },
    });
    return new Set(votes.map((vote) => vote.postId));
  }

  private async votedCommentIds(viewerId: string, commentIds: string[]): Promise<Set<string>> {
    if (commentIds.length === 0) {
      return new Set();
    }
    const votes = await this.prisma.forumCommentVote.findMany({
      where: { userId: viewerId, commentId: { in: commentIds } },
      select: { commentId: true },
    });
    return new Set(votes.map((vote) => vote.commentId));
  }
}
