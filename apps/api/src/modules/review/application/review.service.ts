import { Injectable, NotFoundException } from '@nestjs/common';
import { ReviewQuality } from '@elevatesde/shared-types';
import { ReviewItem } from '../domain/entities/review-item';
import { IReviewRepository } from '../domain/interfaces/review-repository.interface';
import { ReviewItemView } from '../domain/read-models/review-item-view';

const DUE_REVIEW_LIMIT = 50;

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async seedFromAcceptedSubmission(userId: string, problemId: string): Promise<void> {
    const item = ReviewItem.seedFromNewSolve({ userId, problemId, now: new Date() });
    await this.reviewRepository.createIfAbsent(item);
  }

  async dueToday(userId: string): Promise<ReviewItemView[]> {
    await this.backfillFromHistoryIfEmpty(userId);
    return this.reviewRepository.findDueViews(userId, new Date(), DUE_REVIEW_LIMIT);
  }

  async grade(userId: string, problemId: string, quality: ReviewQuality): Promise<ReviewItemView> {
    const item = await this.reviewRepository.findByUserAndProblem(userId, problemId);
    if (!item) {
      throw new NotFoundException('Review item not found');
    }
    await this.reviewRepository.save(item.applyRating(quality, new Date()));
    const view = await this.reviewRepository.findViewByUserAndProblem(userId, problemId);
    if (!view) {
      throw new NotFoundException('Review item not found');
    }
    return view;
  }

  private async backfillFromHistoryIfEmpty(userId: string): Promise<void> {
    if (await this.reviewRepository.hasAny(userId)) {
      return;
    }
    const problemIds = await this.reviewRepository.findAcceptedProblemIds(userId);
    if (problemIds.length === 0) {
      return;
    }
    const now = new Date();
    const items = problemIds.map((problemId) =>
      ReviewItem.seedFromHistory({ userId, problemId, now }),
    );
    await this.reviewRepository.createManyIfAbsent(items);
  }
}
