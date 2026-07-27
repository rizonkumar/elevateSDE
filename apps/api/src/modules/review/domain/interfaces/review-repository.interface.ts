import { ReviewItem } from '../entities/review-item';
import { ReviewItemView } from '../read-models/review-item-view';

export abstract class IReviewRepository {
  abstract findByUserAndProblem(userId: string, problemId: string): Promise<ReviewItem | null>;
  abstract createIfAbsent(item: ReviewItem): Promise<void>;
  abstract createManyIfAbsent(items: ReviewItem[]): Promise<void>;
  abstract save(item: ReviewItem): Promise<void>;
  abstract hasAny(userId: string): Promise<boolean>;
  abstract findAcceptedProblemIds(userId: string): Promise<string[]>;
  abstract findDueViews(userId: string, dueBefore: Date, limit: number): Promise<ReviewItemView[]>;
  abstract findViewByUserAndProblem(
    userId: string,
    problemId: string,
  ): Promise<ReviewItemView | null>;
  abstract countDue(userId: string, dueBefore: Date): Promise<number>;
  abstract countTracked(userId: string): Promise<number>;
  abstract countReviewed(userId: string): Promise<number>;
  abstract findDueAtsBefore(userId: string, before: Date): Promise<Date[]>;
}
