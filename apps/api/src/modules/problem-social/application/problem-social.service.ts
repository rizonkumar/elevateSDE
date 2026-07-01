import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { IProblemSocialRepository } from '../domain/interfaces/problem-social-repository.interface';
import { ProblemDiscussion } from '../domain/entities/problem-discussion';
import { ProblemDiscussionComment } from '../domain/entities/problem-discussion-comment';
import { ProblemList } from '../domain/entities/problem-list';
import { ProblemNote } from '../domain/entities/problem-note';
import {
  BookmarkView,
  ProblemCollectionView,
  ProblemDiscussionCommentView,
  ProblemDiscussionView,
  ProblemNoteView,
} from '../domain/read-models/problem-social-view';

export interface CreateDiscussionInput {
  title: string;
  body: string;
}

export interface CreateCollectionInput {
  name: string;
  isPublic?: boolean;
}

export interface UpdateCollectionInput {
  name?: string;
  isPublic?: boolean;
}

@Injectable()
export class ProblemSocialService {
  constructor(private readonly repository: IProblemSocialRepository) {}

  async listDiscussions(viewerId: string, problemId: string): Promise<ProblemDiscussionView[]> {
    await this.requireProblem(problemId);
    return this.repository.listDiscussions(problemId, viewerId);
  }

  async createDiscussion(
    userId: string,
    problemId: string,
    input: CreateDiscussionInput,
  ): Promise<ProblemDiscussionView> {
    await this.requireProblem(problemId);
    const discussion = ProblemDiscussion.create(randomUUID(), problemId, userId, {
      title: input.title,
      body: input.body,
    });
    await this.repository.createDiscussion(discussion);
    return this.requireDiscussionView(discussion.getId(), userId);
  }

  async getDiscussion(viewerId: string, discussionId: string): Promise<ProblemDiscussionView> {
    return this.requireDiscussionView(discussionId, viewerId);
  }

  async toggleDiscussionUpvote(
    userId: string,
    discussionId: string,
  ): Promise<ProblemDiscussionView> {
    await this.requireDiscussion(discussionId);
    await this.repository.toggleDiscussionVote(discussionId, userId);
    return this.requireDiscussionView(discussionId, userId);
  }

  async listComments(
    viewerId: string,
    discussionId: string,
  ): Promise<ProblemDiscussionCommentView[]> {
    await this.requireDiscussion(discussionId);
    return this.repository.listComments(discussionId, viewerId);
  }

  async addComment(
    userId: string,
    discussionId: string,
    body: string,
  ): Promise<ProblemDiscussionCommentView> {
    await this.requireDiscussion(discussionId);
    const comment = ProblemDiscussionComment.create(randomUUID(), discussionId, userId, body);
    await this.repository.createComment(comment);
    return this.requireCommentView(comment.getId(), userId);
  }

  async toggleCommentUpvote(
    userId: string,
    commentId: string,
  ): Promise<ProblemDiscussionCommentView> {
    const comment = await this.repository.findCommentById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    await this.repository.toggleCommentVote(commentId, userId);
    return this.requireCommentView(commentId, userId);
  }

  async toggleBookmark(userId: string, problemId: string): Promise<boolean> {
    await this.requireProblem(problemId);
    return this.repository.toggleBookmark(userId, problemId);
  }

  async listBookmarks(userId: string): Promise<BookmarkView[]> {
    return this.repository.listBookmarks(userId);
  }

  async getNote(userId: string, problemId: string): Promise<ProblemNoteView | null> {
    await this.requireProblem(problemId);
    return this.repository.findNote(userId, problemId);
  }

  async upsertNote(userId: string, problemId: string, body: string): Promise<ProblemNoteView> {
    await this.requireProblem(problemId);
    const note = ProblemNote.create(randomUUID(), userId, problemId, body);
    return this.repository.upsertNote(userId, problemId, note.getBody());
  }

  async listCollections(userId: string): Promise<ProblemCollectionView[]> {
    return this.repository.listCollections(userId);
  }

  async getCollection(userId: string, listId: string): Promise<ProblemCollectionView> {
    await this.findOwnedCollection(userId, listId);
    return this.requireCollectionView(listId);
  }

  async createCollection(
    userId: string,
    input: CreateCollectionInput,
  ): Promise<ProblemCollectionView> {
    const list = ProblemList.create(randomUUID(), userId, input.name, input.isPublic ?? false);
    await this.repository.createCollection(list);
    return this.requireCollectionView(list.getId());
  }

  async updateCollection(
    userId: string,
    listId: string,
    input: UpdateCollectionInput,
  ): Promise<ProblemCollectionView> {
    const existing = await this.findOwnedCollection(userId, listId);
    let updated = existing;
    if (input.name !== undefined) {
      updated = updated.rename(input.name);
    }
    if (input.isPublic !== undefined) {
      updated = updated.setVisibility(input.isPublic);
    }
    await this.repository.updateCollection(updated);
    return this.requireCollectionView(listId);
  }

  async deleteCollection(userId: string, listId: string): Promise<void> {
    await this.findOwnedCollection(userId, listId);
    await this.repository.deleteCollection(listId);
  }

  async addCollectionItem(
    userId: string,
    listId: string,
    problemId: string,
  ): Promise<ProblemCollectionView> {
    await this.findOwnedCollection(userId, listId);
    await this.requireProblem(problemId);
    const existingIds = await this.repository.listCollectionProblemIds(listId);
    if (!existingIds.includes(problemId)) {
      await this.repository.addCollectionItem(listId, problemId);
    }
    return this.requireCollectionView(listId);
  }

  async removeCollectionItem(
    userId: string,
    listId: string,
    problemId: string,
  ): Promise<ProblemCollectionView> {
    await this.findOwnedCollection(userId, listId);
    await this.repository.removeCollectionItem(listId, problemId);
    return this.requireCollectionView(listId);
  }

  async reorderCollection(
    userId: string,
    listId: string,
    orderedProblemIds: string[],
  ): Promise<ProblemCollectionView> {
    await this.findOwnedCollection(userId, listId);
    const existingIds = await this.repository.listCollectionProblemIds(listId);
    assertSameMembers(existingIds, orderedProblemIds);
    await this.repository.reorderCollection(listId, orderedProblemIds);
    return this.requireCollectionView(listId);
  }

  private async requireProblem(problemId: string): Promise<void> {
    const exists = await this.repository.problemExists(problemId);
    if (!exists) {
      throw new NotFoundException('Problem not found');
    }
  }

  private async requireDiscussion(discussionId: string): Promise<ProblemDiscussion> {
    const discussion = await this.repository.findDiscussionById(discussionId);
    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }
    return discussion;
  }

  private async requireDiscussionView(
    discussionId: string,
    viewerId: string,
  ): Promise<ProblemDiscussionView> {
    const view = await this.repository.findDiscussionView(discussionId, viewerId);
    if (!view) {
      throw new NotFoundException('Discussion not found');
    }
    return view;
  }

  private async requireCommentView(
    commentId: string,
    viewerId: string,
  ): Promise<ProblemDiscussionCommentView> {
    const view = await this.repository.findCommentView(commentId, viewerId);
    if (!view) {
      throw new NotFoundException('Comment not found');
    }
    return view;
  }

  private async requireCollectionView(listId: string): Promise<ProblemCollectionView> {
    const view = await this.repository.findCollectionView(listId);
    if (!view) {
      throw new NotFoundException('List not found');
    }
    return view;
  }

  private async findOwnedCollection(userId: string, listId: string): Promise<ProblemList> {
    const list = await this.repository.findCollectionById(listId);
    if (!list) {
      throw new NotFoundException('List not found');
    }
    if (list.getUserId() !== userId) {
      throw new ForbiddenException('You do not have access to this list');
    }
    return list;
  }
}

function assertSameMembers(existing: string[], incoming: string[]): void {
  if (existing.length !== incoming.length) {
    throw new BadRequestException('Reorder payload must contain every list item exactly once');
  }
  const existingSet = new Set(existing);
  const incomingSet = new Set(incoming);
  if (incomingSet.size !== incoming.length) {
    throw new BadRequestException('Reorder payload contains duplicate problems');
  }
  for (const id of incoming) {
    if (!existingSet.has(id)) {
      throw new BadRequestException('Reorder payload references a problem not in the list');
    }
  }
}
