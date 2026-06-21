import { ForumPostStatus } from '@prisma/client';
import { ForumPost } from '../entities/forum-post';
import { ForumComment } from '../entities/forum-comment';
import { ForumCommentView, ForumPostView } from '../read-models/forum-view';

export abstract class IForumRepository {
  abstract listPublished(viewerId: string): Promise<ForumPostView[]>;
  abstract listAll(viewerId: string): Promise<ForumPostView[]>;
  abstract findPostById(id: string): Promise<ForumPost | null>;
  abstract findPostView(id: string, viewerId: string): Promise<ForumPostView | null>;
  abstract createPost(post: ForumPost): Promise<void>;
  abstract updatePostStatus(id: string, status: ForumPostStatus): Promise<void>;
  abstract incrementViewCount(id: string): Promise<void>;
  abstract togglePostVote(postId: string, userId: string): Promise<void>;
  abstract createReport(postId: string, reporterId: string, reason: string): Promise<void>;
  abstract listComments(postId: string, viewerId: string): Promise<ForumCommentView[]>;
  abstract findCommentById(id: string): Promise<ForumComment | null>;
  abstract findCommentView(id: string, viewerId: string): Promise<ForumCommentView | null>;
  abstract createComment(comment: ForumComment): Promise<void>;
  abstract toggleCommentVote(commentId: string, userId: string): Promise<void>;
}
