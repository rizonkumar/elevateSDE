export const QUEUE_PREFIX = 'elevatesde';

export const QUEUE_NAMES = {
  CODE_EXECUTION: 'code-execution',
  RESUME: 'resume',
  MOCK_INTERVIEW: 'mock-interview',
  SCHEDULED: 'scheduled',
  EMAIL: 'email',
  CODE_REVIEW: 'code-review',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
