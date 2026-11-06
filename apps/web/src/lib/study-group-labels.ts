import type {
  StudyGoalMetric,
  StudyGoalScope,
  StudyGroupActivityKind,
  StudyGroupJoinPolicy,
  StudyGroupLeaderboardWindow,
} from '@elevatesde/shared-types';

interface MetricMeta {
  label: string;
  unit: string;
  singular: string;
}

export const METRIC_META: Record<StudyGoalMetric, MetricMeta> = {
  PROBLEMS_SOLVED: { label: 'Problems solved', unit: 'problems', singular: 'problem' },
  POINTS: { label: 'Points earned', unit: 'points', singular: 'point' },
  DAILY_CHALLENGES: { label: 'Daily challenges', unit: 'challenges', singular: 'challenge' },
  CONTESTS_ENTERED: { label: 'Contests entered', unit: 'contests', singular: 'contest' },
};

export const SCOPE_LABEL: Record<StudyGoalScope, string> = {
  GROUP_TOTAL: 'Group total',
  EACH_MEMBER: 'Each member',
};

export const JOIN_POLICY_LABEL: Record<StudyGroupJoinPolicy, string> = {
  OPEN: 'Open to everyone',
  INVITE_ONLY: 'Invite only',
};

export const WINDOW_LABEL: Record<StudyGroupLeaderboardWindow, string> = {
  goal: 'Current goal',
  week: 'This week',
  all: 'All time',
};

export const ACTIVITY_VERB: Record<StudyGroupActivityKind, string> = {
  PROBLEM_SOLVED: 'solved',
  DAILY_CHALLENGE: 'completed the daily challenge',
  CONTEST_RESULT: 'placed in',
};

export function formatMetricValue(metric: StudyGoalMetric, value: number): string {
  const meta = METRIC_META[metric];
  return `${value.toLocaleString()} ${value === 1 ? meta.singular : meta.unit}`;
}

export function daysLeftLabel(endsAt: string, now: number = Date.now()): string {
  const remaining = new Date(endsAt).getTime() - now;
  if (remaining <= 0) {
    return 'Ended';
  }
  const days = Math.ceil(remaining / 86_400_000);
  return days === 1 ? '1 day left' : `${days} days left`;
}

export function startsInLabel(startsAt: string, now: number = Date.now()): string {
  const days = Math.ceil((new Date(startsAt).getTime() - now) / 86_400_000);
  return days <= 1 ? 'Starts tomorrow' : `Starts in ${days} days`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
