export const SCHEDULED_JOBS = {
  RESET_WEEKLY_POINTS: 'leaderboard.reset-weekly',
  RESET_MONTHLY_POINTS: 'leaderboard.reset-monthly',
  EXPIRE_STREAKS: 'streaks.expire',
  FINALIZE_CONTESTS: 'contests.finalize',
  SWEEP_PREPARATION_REMINDERS: 'preparation.reminders-sweep',
} as const;

export type ScheduledJobName = (typeof SCHEDULED_JOBS)[keyof typeof SCHEDULED_JOBS];

export const SCHEDULED_JOB_PATTERNS: Readonly<Record<ScheduledJobName, string>> = {
  [SCHEDULED_JOBS.RESET_WEEKLY_POINTS]: '0 0 * * 1',
  [SCHEDULED_JOBS.RESET_MONTHLY_POINTS]: '0 0 1 * *',
  [SCHEDULED_JOBS.EXPIRE_STREAKS]: '5 0 * * *',
  [SCHEDULED_JOBS.FINALIZE_CONTESTS]: '*/5 * * * *',
  [SCHEDULED_JOBS.SWEEP_PREPARATION_REMINDERS]: '0 8 * * *',
};

export const SCHEDULED_JOB_NAMES: readonly ScheduledJobName[] = Object.values(SCHEDULED_JOBS);

export function isScheduledJobName(value: string): value is ScheduledJobName {
  return (SCHEDULED_JOB_NAMES as readonly string[]).includes(value);
}
