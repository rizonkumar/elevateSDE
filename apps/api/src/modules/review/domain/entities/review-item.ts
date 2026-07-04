import { randomUUID } from 'node:crypto';
import { ReviewQuality } from '@elevatesde/shared-types';
import { addDays, startOfUtcDay } from '../../../daily-challenge/domain/daily-date';

const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;
const FIRST_INTERVAL_DAYS = 1;
const SECOND_INTERVAL_DAYS = 6;
const PASSING_QUALITY = 3;
const MAX_QUALITY = 5;
const EASE_BASE_DELTA = 0.1;
const EASE_LINEAR_PENALTY = 0.08;
const EASE_QUADRATIC_PENALTY = 0.02;

export interface ReviewItemProps {
  id: string;
  userId: string;
  problemId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
  createdAt: Date;
}

export interface SeedReviewItemInput {
  userId: string;
  problemId: string;
  now: Date;
}

export class ReviewItem {
  private constructor(private readonly props: ReviewItemProps) {}

  static seedFromNewSolve(input: SeedReviewItemInput): ReviewItem {
    return ReviewItem.seed(input, addDays(input.now, FIRST_INTERVAL_DAYS));
  }

  static seedFromHistory(input: SeedReviewItemInput): ReviewItem {
    return ReviewItem.seed(input, startOfUtcDay(input.now));
  }

  static reconstitute(props: ReviewItemProps): ReviewItem {
    return new ReviewItem(props);
  }

  private static seed(input: SeedReviewItemInput, dueAt: Date): ReviewItem {
    return new ReviewItem({
      id: randomUUID(),
      userId: input.userId,
      problemId: input.problemId,
      ease: INITIAL_EASE,
      intervalDays: 0,
      repetitions: 0,
      dueAt,
      lastReviewedAt: null,
      createdAt: input.now,
    });
  }

  applyRating(quality: ReviewQuality, reviewedAt: Date): ReviewItem {
    const ease = ReviewItem.nextEase(this.props.ease, quality);
    const passed = quality >= PASSING_QUALITY;
    const intervalDays = passed
      ? ReviewItem.nextInterval(this.props.repetitions, this.props.intervalDays, ease)
      : FIRST_INTERVAL_DAYS;
    const repetitions = passed ? this.props.repetitions + 1 : 0;

    return ReviewItem.reconstitute({
      ...this.props,
      ease,
      intervalDays,
      repetitions,
      dueAt: addDays(reviewedAt, intervalDays),
      lastReviewedAt: reviewedAt,
    });
  }

  private static nextEase(currentEase: number, quality: ReviewQuality): number {
    const shortfall = MAX_QUALITY - quality;
    const delta =
      EASE_BASE_DELTA - shortfall * (EASE_LINEAR_PENALTY + shortfall * EASE_QUADRATIC_PENALTY);
    return Math.max(MIN_EASE, currentEase + delta);
  }

  private static nextInterval(repetitions: number, intervalDays: number, ease: number): number {
    if (repetitions === 0) {
      return FIRST_INTERVAL_DAYS;
    }
    if (repetitions === 1) {
      return SECOND_INTERVAL_DAYS;
    }
    return Math.round(intervalDays * ease);
  }

  getId(): string {
    return this.props.id;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getProblemId(): string {
    return this.props.problemId;
  }

  getEase(): number {
    return this.props.ease;
  }

  getIntervalDays(): number {
    return this.props.intervalDays;
  }

  getRepetitions(): number {
    return this.props.repetitions;
  }

  getDueAt(): Date {
    return this.props.dueAt;
  }

  getLastReviewedAt(): Date | null {
    return this.props.lastReviewedAt;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }
}
