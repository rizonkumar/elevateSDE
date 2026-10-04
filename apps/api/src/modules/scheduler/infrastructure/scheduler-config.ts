const SCHEDULER_ENABLED_KEY = 'SCHEDULER_ENABLED';

export function isSchedulerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[SCHEDULER_ENABLED_KEY]?.trim().toLowerCase() !== 'false';
}
