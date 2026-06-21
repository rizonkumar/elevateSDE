import {
  ForumComment as PrismaForumComment,
  ForumPost as PrismaForumPost,
} from '@prisma/client';
import { ForumPost } from '../../domain/entities/forum-post';
import { ForumComment } from '../../domain/entities/forum-comment';

export class ForumMapper {
  static toDomainPost(record: PrismaForumPost): ForumPost {
    return ForumPost.reconstitute({
      id: record.id,
      userId: record.userId,
      title: record.title,
      body: record.body,
      tags: record.tags,
      status: record.status,
      viewCount: record.viewCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPostPersistence(
    post: ForumPost,
  ): Pick<PrismaForumPost, 'id' | 'userId' | 'title' | 'body' | 'tags' | 'status' | 'viewCount'> {
    return {
      id: post.getId(),
      userId: post.getUserId(),
      title: post.getTitle(),
      body: post.getBody(),
      tags: post.getTags(),
      status: post.getStatus(),
      viewCount: post.getViewCount(),
    };
  }

  static toDomainComment(record: PrismaForumComment): ForumComment {
    return ForumComment.reconstitute(
      record.id,
      record.postId,
      record.userId,
      record.body,
      record.createdAt,
      record.updatedAt,
    );
  }

  static toCommentPersistence(
    comment: ForumComment,
  ): Pick<PrismaForumComment, 'id' | 'postId' | 'userId' | 'body'> {
    return {
      id: comment.getId(),
      postId: comment.getPostId(),
      userId: comment.getUserId(),
      body: comment.getBody(),
    };
  }
}
