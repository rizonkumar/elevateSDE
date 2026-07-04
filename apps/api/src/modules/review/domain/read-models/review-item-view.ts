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
