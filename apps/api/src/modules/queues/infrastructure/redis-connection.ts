import type { RedisOptions } from 'bullmq';

const DEFAULT_REDIS_URL = 'redis://localhost:6379';

export function buildRedisConnection(): RedisOptions {
  return {
    url: process.env.REDIS_URL ?? DEFAULT_REDIS_URL,
    maxRetriesPerRequest: null,
  };
}
