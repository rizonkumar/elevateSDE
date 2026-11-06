import type { RedisOptions } from 'bullmq';

const DEFAULT_REDIS_URL = 'redis://localhost:6379';

export function resolveRedisUrl(): string {
  return process.env.REDIS_URL ?? DEFAULT_REDIS_URL;
}

export function buildRedisConnection(): RedisOptions {
  return {
    url: resolveRedisUrl(),
    maxRetriesPerRequest: null,
  };
}
