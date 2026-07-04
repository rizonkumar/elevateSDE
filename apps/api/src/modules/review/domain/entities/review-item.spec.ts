import { addDays, startOfUtcDay } from '../../../daily-challenge/domain/daily-date';
import { ReviewItem } from './review-item';

describe('ReviewItem', () => {
  const now = new Date('2026-07-04T10:00:00.000Z');
  const seedInput = { userId: 'user-1', problemId: 'problem-1', now };

  describe('seedFromNewSolve', () => {
    it('schedules the first review for the next day with default scheduling state', () => {
      const item = ReviewItem.seedFromNewSolve(seedInput);

      expect(item.getUserId()).toBe('user-1');
      expect(item.getProblemId()).toBe('problem-1');
      expect(item.getEase()).toBe(2.5);
      expect(item.getIntervalDays()).toBe(0);
      expect(item.getRepetitions()).toBe(0);
      expect(item.getDueAt()).toEqual(addDays(now, 1));
      expect(item.getLastReviewedAt()).toBeNull();
      expect(item.getCreatedAt()).toEqual(now);
    });
  });

  describe('seedFromHistory', () => {
    it('schedules the first review for the current day', () => {
      const item = ReviewItem.seedFromHistory(seedInput);

      expect(item.getDueAt()).toEqual(startOfUtcDay(now));
      expect(item.getEase()).toBe(2.5);
      expect(item.getRepetitions()).toBe(0);
    });
  });

  describe('applyRating', () => {
    it('progresses intervals 1, 6, then round(interval * ease) on perfect recall', () => {
      const first = ReviewItem.seedFromNewSolve(seedInput).applyRating(5, now);
      expect(first.getRepetitions()).toBe(1);
      expect(first.getIntervalDays()).toBe(1);
      expect(first.getEase()).toBeCloseTo(2.6);
      expect(first.getDueAt()).toEqual(addDays(now, 1));

      const secondReview = addDays(now, 1);
      const second = first.applyRating(5, secondReview);
      expect(second.getRepetitions()).toBe(2);
      expect(second.getIntervalDays()).toBe(6);
      expect(second.getEase()).toBeCloseTo(2.7);
      expect(second.getDueAt()).toEqual(addDays(secondReview, 6));

      const thirdReview = addDays(secondReview, 6);
      const third = second.applyRating(5, thirdReview);
      expect(third.getRepetitions()).toBe(3);
      expect(third.getIntervalDays()).toBe(Math.round(6 * third.getEase()));
      expect(third.getEase()).toBeCloseTo(2.8);
      expect(third.getDueAt()).toEqual(addDays(thirdReview, third.getIntervalDays()));
    });

    it('keeps ease unchanged on quality 4', () => {
      const graded = ReviewItem.seedFromNewSolve(seedInput).applyRating(4, now);

      expect(graded.getEase()).toBeCloseTo(2.5);
      expect(graded.getRepetitions()).toBe(1);
    });

    it('lowers ease on quality 3 while still advancing repetitions', () => {
      const graded = ReviewItem.seedFromNewSolve(seedInput).applyRating(3, now);

      expect(graded.getEase()).toBeCloseTo(2.36);
      expect(graded.getRepetitions()).toBe(1);
      expect(graded.getIntervalDays()).toBe(1);
    });

    it('resets repetitions and interval on failed recall', () => {
      const progressed = ReviewItem.seedFromNewSolve(seedInput)
        .applyRating(5, now)
        .applyRating(5, addDays(now, 1));

      const failed = progressed.applyRating(2, addDays(now, 7));

      expect(failed.getRepetitions()).toBe(0);
      expect(failed.getIntervalDays()).toBe(1);
      expect(failed.getEase()).toBeLessThan(progressed.getEase());
      expect(failed.getDueAt()).toEqual(addDays(addDays(now, 7), 1));
    });

    it('never drops ease below the floor of 1.3', () => {
      let item = ReviewItem.seedFromNewSolve(seedInput);
      for (let review = 0; review < 5; review += 1) {
        item = item.applyRating(0, now);
      }

      expect(item.getEase()).toBe(1.3);
    });

    it('returns a new instance and leaves the original unchanged', () => {
      const original = ReviewItem.seedFromNewSolve(seedInput);
      const graded = original.applyRating(5, now);

      expect(graded).not.toBe(original);
      expect(original.getRepetitions()).toBe(0);
      expect(original.getEase()).toBe(2.5);
      expect(original.getLastReviewedAt()).toBeNull();
      expect(graded.getLastReviewedAt()).toEqual(now);
    });
  });
});
