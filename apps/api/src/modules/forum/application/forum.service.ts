import { Injectable, NotFoundException } from '@nestjs/common';
import { ForumPostStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { IForumRepository } from '../domain/interfaces/forum-repository.interface';
import { ForumPost } from '../domain/entities/forum-post';
import { ForumComment } from '../domain/entities/forum-comment';
import { ForumCommentView, ForumPostView } from '../domain/read-models/forum-view';

export interface CreateForumPostInput {
  title: string;
  body: string;
  tags: string[];
}

@Injectable()
export class ForumService {
  constructor(private readonly forumRepository: IForumRepository) {}

  async listFeed(viewerId: string): Promise<ForumPostView[]> {
    return this.forumRepository.listPublished(viewerId);
  }

  async getPost(viewerId: string, id: string): Promise<ForumPostView> {
    const post = await this.findPublished(id);
    await this.forumRepository.incrementViewCount(post.getId());
    return this.requirePostView(id, viewerId);
  }

  async createPost(userId: string, input: CreateForumPostInput): Promise<ForumPostView> {
    const post = ForumPost.create(randomUUID(), userId, {
      title: input.title,
      body: input.body,
      tags: input.tags,
    });
    await this.forumRepository.createPost(post);
    return this.requirePostView(post.getId(), userId);
  }

  async togglePostUpvote(userId: string, id: string): Promise<ForumPostView> {
    await this.findPublished(id);
    await this.forumRepository.togglePostVote(id, userId);
    return this.requirePostView(id, userId);
  }

  async reportPost(userId: string, id: string, reason: string): Promise<void> {
    await this.findPublished(id);
    await this.forumRepository.createReport(id, userId, reason);
  }

  async listComments(viewerId: string, postId: string): Promise<ForumCommentView[]> {
    await this.findPublished(postId);
    return this.forumRepository.listComments(postId, viewerId);
  }

  async addComment(userId: string, postId: string, body: string): Promise<ForumCommentView> {
    await this.findPublished(postId);
    const comment = ForumComment.create(randomUUID(), postId, userId, body);
    await this.forumRepository.createComment(comment);
    return this.requireCommentView(comment.getId(), userId);
  }

  async toggleCommentUpvote(userId: string, commentId: string): Promise<ForumCommentView> {
    const comment = await this.forumRepository.findCommentById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    await this.forumRepository.toggleCommentVote(commentId, userId);
    return this.requireCommentView(commentId, userId);
  }

  async listAllForAdmin(viewerId: string): Promise<ForumPostView[]> {
    return this.forumRepository.listAll(viewerId);
  }

  async listCommentsForAdmin(viewerId: string, postId: string): Promise<ForumCommentView[]> {
    await this.requirePost(postId);
    return this.forumRepository.listComments(postId, viewerId);
  }

  async updatePostStatus(
    viewerId: string,
    id: string,
    status: ForumPostStatus,
  ): Promise<ForumPostView> {
    await this.requirePost(id);
    await this.forumRepository.updatePostStatus(id, status);
    return this.requirePostView(id, viewerId);
  }

  private async findPublished(id: string): Promise<ForumPost> {
    const post = await this.requirePost(id);
    if (!post.isPublished()) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  private async requirePost(id: string): Promise<ForumPost> {
    const post = await this.forumRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  private async requirePostView(id: string, viewerId: string): Promise<ForumPostView> {
    const view = await this.forumRepository.findPostView(id, viewerId);
    if (!view) {
      throw new NotFoundException('Post not found');
    }
    return view;
  }

  private async requireCommentView(id: string, viewerId: string): Promise<ForumCommentView> {
    const view = await this.forumRepository.findCommentView(id, viewerId);
    if (!view) {
      throw new NotFoundException('Comment not found');
    }
    return view;
  }
}
