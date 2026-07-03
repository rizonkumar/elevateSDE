import type { AssessmentDifficulty } from '@elevatesde/shared-types';
import type { BadgeVariant } from '@elevatesde/ui';

export const DIFFICULTIES: AssessmentDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

export const DIFFICULTY_LABEL: Record<AssessmentDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export const DIFFICULTY_ORDER: Record<AssessmentDifficulty, number> = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
};

export const DIFFICULTY_TEXT: Record<AssessmentDifficulty, string> = {
  EASY: 'text-(--color-success)',
  MEDIUM: 'text-(--color-warning)',
  HARD: 'text-(--color-danger)',
};
