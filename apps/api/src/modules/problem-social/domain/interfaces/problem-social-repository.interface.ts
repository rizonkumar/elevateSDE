import { ProblemDiscussion } from '../entities/problem-discussion';
import { ProblemDiscussionComment } from '../entities/problem-discussion-comment';
import { ProblemList } from '../entities/problem-list';
import {
  BookmarkView,
  ProblemCollectionView,
  ProblemDiscussionCommentView,
  ProblemDiscussionView,
  ProblemNoteView,
} from '../read-models/problem-social-view';

export abstract class IProblemSocialRepository {
  abstract problemExists(problemId: string): Promise<boolean>;

  abstract listDiscussions(problemId: string, viewerId: string): Promise<ProblemDiscussionView[]>;
  abstract findDiscussionById(id: string): Promise<ProblemDiscussion | null>;
  abstract findDiscussionView(id: string, viewerId: string): Promise<ProblemDiscussionView | null>;
  abstract createDiscussion(discussion: ProblemDiscussion): Promise<void>;
  abstract toggleDiscussionVote(discussionId: string, userId: string): Promise<void>;

  abstract listComments(
    discussionId: string,
    viewerId: string,
  ): Promise<ProblemDiscussionCommentView[]>;
  abstract findCommentById(id: string): Promise<ProblemDiscussionComment | null>;
  abstract findCommentView(
    id: string,
    viewerId: string,
  ): Promise<ProblemDiscussionCommentView | null>;
  abstract createComment(comment: ProblemDiscussionComment): Promise<void>;
  abstract toggleCommentVote(commentId: string, userId: string): Promise<void>;

  abstract toggleBookmark(userId: string, problemId: string): Promise<boolean>;
  abstract listBookmarks(userId: string): Promise<BookmarkView[]>;

  abstract findNote(userId: string, problemId: string): Promise<ProblemNoteView | null>;
  abstract upsertNote(userId: string, problemId: string, body: string): Promise<ProblemNoteView>;

  abstract listCollections(userId: string): Promise<ProblemCollectionView[]>;
  abstract findCollectionById(id: string): Promise<ProblemList | null>;
  abstract findCollectionView(id: string): Promise<ProblemCollectionView | null>;
  abstract createCollection(list: ProblemList): Promise<void>;
  abstract updateCollection(list: ProblemList): Promise<void>;
  abstract deleteCollection(id: string): Promise<void>;
  abstract addCollectionItem(listId: string, problemId: string): Promise<void>;
  abstract removeCollectionItem(listId: string, problemId: string): Promise<void>;
  abstract listCollectionProblemIds(listId: string): Promise<string[]>;
  abstract reorderCollection(listId: string, orderedProblemIds: string[]): Promise<void>;
}
