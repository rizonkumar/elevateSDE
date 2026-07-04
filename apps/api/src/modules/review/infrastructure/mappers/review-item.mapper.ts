import { ReviewItem as PrismaReviewItem } from '@prisma/client';
import { ReviewItem } from '../../domain/entities/review-item';

export class ReviewItemMapper {
  static toDomain(record: PrismaReviewItem): ReviewItem {
    return ReviewItem.reconstitute({
      id: record.id,
      userId: record.userId,
      problemId: record.problemId,
      ease: record.ease,
      intervalDays: record.intervalDays,
      repetitions: record.repetitions,
      dueAt: record.dueAt,
      lastReviewedAt: record.lastReviewedAt,
      createdAt: record.createdAt,
    });
  }

  static toPersistence(
    item: ReviewItem,
  ): Pick<
    PrismaReviewItem,
    | 'id'
    | 'userId'
    | 'problemId'
    | 'ease'
    | 'intervalDays'
    | 'repetitions'
    | 'dueAt'
    | 'lastReviewedAt'
  > {
    return {
      id: item.getId(),
      userId: item.getUserId(),
      problemId: item.getProblemId(),
      ...ReviewItemMapper.toScheduleUpdate(item),
    };
  }

  static toScheduleUpdate(
    item: ReviewItem,
  ): Pick<PrismaReviewItem, 'ease' | 'intervalDays' | 'repetitions' | 'dueAt' | 'lastReviewedAt'> {
    return {
      ease: item.getEase(),
      intervalDays: item.getIntervalDays(),
      repetitions: item.getRepetitions(),
      dueAt: item.getDueAt(),
      lastReviewedAt: item.getLastReviewedAt(),
    };
  }
}
