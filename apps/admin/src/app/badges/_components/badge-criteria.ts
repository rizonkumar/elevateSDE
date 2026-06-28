import type { BadgeCriteriaType } from '@elevatesde/shared-types';

export const CRITERIA_LABEL: Record<BadgeCriteriaType, string> = {
  PROBLEMS_SOLVED: 'Problems solved',
  STREAK_DAYS: 'Streak days',
  ASSESSMENTS_COMPLETED: 'Assessments completed',
  FORUM_POSTS: 'Forum posts',
  POINTS: 'Points',
};

export const CRITERIA_OPTIONS = (Object.keys(CRITERIA_LABEL) as BadgeCriteriaType[]).map(
  (value) => ({ value, label: CRITERIA_LABEL[value] }),
);
