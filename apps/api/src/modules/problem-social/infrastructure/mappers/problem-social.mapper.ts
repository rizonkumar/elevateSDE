import {
  ProblemDiscussion as PrismaProblemDiscussion,
  ProblemDiscussionComment as PrismaProblemDiscussionComment,
  ProblemList as PrismaProblemList,
} from '@prisma/client';
import { ProblemDiscussion } from '../../domain/entities/problem-discussion';
import { ProblemDiscussionComment } from '../../domain/entities/problem-discussion-comment';
import { ProblemList } from '../../domain/entities/problem-list';

export class ProblemSocialMapper {
  static toDomainDiscussion(record: PrismaProblemDiscussion): ProblemDiscussion {
    return ProblemDiscussion.reconstitute({
      id: record.id,
      problemId: record.problemId,
      userId: record.userId,
      title: record.title,
      body: record.body,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toDiscussionPersistence(
    discussion: ProblemDiscussion,
  ): Pick<PrismaProblemDiscussion, 'id' | 'problemId' | 'userId' | 'title' | 'body'> {
    return {
      id: discussion.getId(),
      problemId: discussion.getProblemId(),
      userId: discussion.getUserId(),
      title: discussion.getTitle(),
      body: discussion.getBody(),
    };
  }

  static toDomainComment(record: PrismaProblemDiscussionComment): ProblemDiscussionComment {
    return ProblemDiscussionComment.reconstitute(
      record.id,
      record.discussionId,
      record.userId,
      record.body,
      record.createdAt,
      record.updatedAt,
    );
  }

  static toCommentPersistence(
    comment: ProblemDiscussionComment,
  ): Pick<PrismaProblemDiscussionComment, 'id' | 'discussionId' | 'userId' | 'body'> {
    return {
      id: comment.getId(),
      discussionId: comment.getDiscussionId(),
      userId: comment.getUserId(),
      body: comment.getBody(),
    };
  }

  static toDomainList(record: PrismaProblemList): ProblemList {
    return ProblemList.reconstitute({
      id: record.id,
      userId: record.userId,
      name: record.name,
      isPublic: record.isPublic,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toListPersistence(
    list: ProblemList,
  ): Pick<PrismaProblemList, 'id' | 'userId' | 'name' | 'isPublic'> {
    return {
      id: list.getId(),
      userId: list.getUserId(),
      name: list.getName(),
      isPublic: list.getIsPublic(),
    };
  }
}
