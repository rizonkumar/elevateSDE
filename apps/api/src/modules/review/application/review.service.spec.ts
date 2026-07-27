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
        (item) => item.getUserId() === userId && item.getDueAt().getTime() <= dueBefore.getTime(),
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

  async countDue(userId: string, dueBefore: Date): Promise<number> {
    return this.forUser(userId).filter((item) => item.getDueAt().getTime() <= dueBefore.getTime())
      .length;
  }

  async countTracked(userId: string): Promise<number> {
    return this.forUser(userId).length;
  }

  async countReviewed(userId: string): Promise<number> {
    return this.forUser(userId).filter((item) => item.getLastReviewedAt() !== null).length;
  }

  async findDueAtsBefore(userId: string, before: Date): Promise<Date[]> {
    return this.forUser(userId)
      .filter((item) => item.getDueAt().getTime() < before.getTime())
      .map((item) => item.getDueAt());
  }

  private forUser(userId: string): ReviewItem[] {
    return [...this.items.values()].filter((item) => item.getUserId() === userId);
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

  describe('summary', () => {
    it('backfills from history and reports every item as due today', async () => {
      repository.acceptedProblemIds = ['problem-1', 'problem-2'];

      const summary = await service.summary('user-1');

      expect(summary.dueCount).toBe(2);
      expect(summary.trackedCount).toBe(2);
      expect(summary.reviewedCount).toBe(0);
      expect(summary.forecast).toHaveLength(30);
      expect(summary.forecast[0]?.count).toBe(2);
    });

    it('counts graded items as reviewed and moves them out of the due bucket', async () => {
      await service.seedFromAcceptedSubmission('user-1', 'problem-1');
      await service.grade('user-1', 'problem-1', 5);

      const summary = await service.summary('user-1');

      expect(summary.dueCount).toBe(0);
      expect(summary.reviewedCount).toBe(1);
      expect(summary.forecast[0]?.count).toBe(0);
      expect(summary.forecast.reduce((total, day) => total + day.count, 0)).toBe(1);
    });

    it('excludes items scheduled beyond the forecast horizon', async () => {
      repository.acceptedProblemIds = ['problem-1'];
      await service.summary('user-1');
      for (let repetition = 0; repetition < 4; repetition += 1) {
        await service.grade('user-1', 'problem-1', 5);
      }

      const summary = await service.summary('user-1');

      expect(summary.trackedCount).toBe(1);
      expect(summary.forecast.reduce((total, day) => total + day.count, 0)).toBe(0);
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
