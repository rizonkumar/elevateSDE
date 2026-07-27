import { AssessmentDifficulty } from '@prisma/client';

export interface ReviewProblemView {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  tags: string[];
  timeLimitMinutes: number;
}

export interface ReviewItemView {
  problem: ReviewProblemView;
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  lastReviewedAt: Date | null;
}

export interface ReviewForecastDayView {
  date: string;
  count: number;
}

export interface ReviewSummaryView {
  dueCount: number;
  trackedCount: number;
  reviewedCount: number;
  forecast: ReviewForecastDayView[];
}
