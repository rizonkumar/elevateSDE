export const QUEUE_PREFIX = 'elevatesde';

export const QUEUE_NAMES = {
  CODE_EXECUTION: 'code-execution',
  RESUME: 'resume',
  SCHEDULED: 'scheduled',
  EMAIL: 'email',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
