import { AssessmentDifficulty } from '@prisma/client';

export const DIFFICULTY_POINTS: Record<AssessmentDifficulty, number> = {
  EASY: 10,
  MEDIUM: 25,
  HARD: 50,
};

export function pointsForDifficulty(difficulty: AssessmentDifficulty): number {
  return DIFFICULTY_POINTS[difficulty];
}
