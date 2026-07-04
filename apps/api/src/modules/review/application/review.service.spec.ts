import { NotFoundException } from '@nestjs/common';
import { AssessmentDifficulty } from '@prisma/client';
import { addDays } from '../../daily-challenge/domain/daily-date';
import { ReviewItem } from '../domain/entities/review-item';
import { IReviewRepository } from '../domain/interfaces/review-repository.interface';
import { ReviewItemView } from '../domain/read-models/review-item-view';
import { ReviewService } from './review.service';

class FakeReviewRepository implements IReviewRepository {
  readonly items = new Map<string, ReviewItem>();
  readonly savedItems: ReviewItem[] = [];
  acceptedProblemIds: string[] = [];

  async findByUserAndProblem(userId: string, problemId: string): Promise<ReviewItem | null> {
    return this.items.get(this.key(userId, problemId)) ?? null;
  }

  async createIfAbsent(item: ReviewItem): Promise<void> {
    const key = this.key(item.getUserId(), item.getProblemId());
    if (!this.items.has(key)) {
      this.items.set(key, item);
    }
  }

  async createManyIfAbsent(items: ReviewItem[]): Promise<void> {
    for (const item of items) {
      await this.createIfAbsent(item);
    }
  }

  async save(item: ReviewItem): Promise<void> {
    this.items.set(this.key(item.getUserId(), item.getProblemId()), item);
    this.savedItems.push(item);
  }

  async hasAny(userId: string): Promise<boolean> {
    return [...this.items.values()].some((item) => item.getUserId() === userId);
  }

  async findAcceptedProblemIds(): Promise<string[]> {
    return this.acceptedProblemIds;
  }

  async findDueViews(userId: string, dueBefore: Date, limit: number): Promise<ReviewItemView[]> {
    return [...this.items.values()]
      .filter(
        (item) =>
          item.getUserId() === userId && item.getDueAt().getTime() <= dueBefore.getTime(),
      )
      .sort((a, b) => a.getDueAt().getTime() - b.getDueAt().getTime())
      .slice(0, limit)
      .map((item) => this.toView(item));
  }

  async findViewByUserAndProblem(
    userId: string,
    problemId: string,
  ): Promise<ReviewItemView | null> {
    const item = this.items.get(this.key(userId, problemId));
    return item ? this.toView(item) : null;
  }

  private key(userId: string, problemId: string): string {
    return `${userId}:${problemId}`;
  }

  private toView(item: ReviewItem): ReviewItemView {
    return {
      problem: {
        id: item.getProblemId(),
        title: 'Two Sum',
        difficulty: AssessmentDifficulty.EASY,
        tags: ['Array'],
        timeLimitMinutes: 30,
      },
      ease: item.getEase(),
      intervalDays: item.getIntervalDays(),
      repetitions: item.getRepetitions(),
      dueAt: item.getDueAt(),
      lastReviewedAt: item.getLastReviewedAt(),
    };
  }
}

describe('ReviewService', () => {
  let repository: FakeReviewRepository;
  let service: ReviewService;

  beforeEach(() => {
    repository = new FakeReviewRepository();
    service = new ReviewService(repository);
  });

  describe('seedFromAcceptedSubmission', () => {
    it('creates a review item for a newly solved problem', async () => {
      await service.seedFromAcceptedSubmission('user-1', 'problem-1');

      const item = await repository.findByUserAndProblem('user-1', 'problem-1');
      expect(item).not.toBeNull();
      expect(item?.getRepetitions()).toBe(0);
    });

    it('keeps the existing schedule when the problem is solved again', async () => {
      await service.seedFromAcceptedSubmission('user-1', 'problem-1');
      const first = await repository.findByUserAndProblem('user-1', 'problem-1');

      await service.seedFromAcceptedSubmission('user-1', 'problem-1');
      const second = await repository.findByUserAndProblem('user-1', 'problem-1');

      expect(second?.getId()).toBe(first?.getId());
      expect(repository.items.size).toBe(1);
    });
  });

  describe('dueToday', () => {
    it('backfills from historical accepted submissions when the user has no items', async () => {
      repository.acceptedProblemIds = ['problem-1', 'problem-2'];

      const due = await service.dueToday('user-1');

      expect(due).toHaveLength(2);
      expect(repository.items.size).toBe(2);
    });

    it('does not backfill when the user already has items', async () => {
      await service.seedFromAcceptedSubmission('user-1', 'problem-1');
      repository.acceptedProblemIds = ['problem-1', 'problem-2', 'problem-3'];

      await service.dueToday('user-1');

      expect(repository.items.size).toBe(1);
    });

    it('returns only items due now, ordered by due date', async () => {
      repository.acceptedProblemIds = ['problem-1'];
      await service.dueToday('user-1');
      await service.seedFromAcceptedSubmission('user-1', 'problem-2');

      const due = await service.dueToday('user-1');

      expect(due).toHaveLength(1);
      expect(due[0]?.problem.id).toBe('problem-1');
    });
  });

  describe('grade', () => {
    it('advances the schedule and persists the graded item', async () => {
      await service.seedFromAcceptedSubmission('user-1', 'problem-1');

      const view = await service.grade('user-1', 'problem-1', 5);

      expect(view.repetitions).toBe(1);
      expect(view.intervalDays).toBe(1);
      expect(view.dueAt).toEqual(addDays(view.lastReviewedAt ?? new Date(), 1));
      expect(repository.savedItems).toHaveLength(1);
    });

    it('throws NotFoundException for a problem without a review item', async () => {
      await expect(service.grade('user-1', 'unknown-problem', 4)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
