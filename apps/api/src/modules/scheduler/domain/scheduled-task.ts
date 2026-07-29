export const SCHEDULED_TASKS = {
  WEEKLY_POINTS_ROLLOVER: 'weekly-points-rollover',
  MONTHLY_POINTS_ROLLOVER: 'monthly-points-rollover',
  CONTEST_STATUS_SYNC: 'contest-status-sync',
  INVITATION_EXPIRY_SWEEP: 'invitation-expiry-sweep',
} as const;

export type ScheduledTask = (typeof SCHEDULED_TASKS)[keyof typeof SCHEDULED_TASKS];

export const SCHEDULED_TASK_PATTERNS: Record<ScheduledTask, string> = {
  [SCHEDULED_TASKS.WEEKLY_POINTS_ROLLOVER]: '0 0 * * 1',
  [SCHEDULED_TASKS.MONTHLY_POINTS_ROLLOVER]: '0 0 1 * *',
  [SCHEDULED_TASKS.CONTEST_STATUS_SYNC]: '* * * * *',
  [SCHEDULED_TASKS.INVITATION_EXPIRY_SWEEP]: '0 * * * *',
};

export const ALL_SCHEDULED_TASKS: ScheduledTask[] = Object.values(SCHEDULED_TASKS);
