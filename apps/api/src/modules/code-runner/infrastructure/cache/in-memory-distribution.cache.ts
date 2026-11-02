import { Injectable } from '@nestjs/common';
import { IDistributionCache } from '../../domain/interfaces/distribution-cache.interface';
import { PerformanceDistribution } from '../../domain/insights/performance-insights';

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 500;

interface CacheEntry {
  value: PerformanceDistribution;
  expiresAt: number;
}

@Injectable()
export class InMemoryDistributionCache implements IDistributionCache {
  private readonly entries = new Map<string, CacheEntry>();

  get(key: string): PerformanceDistribution | null {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: PerformanceDistribution): void {
    if (this.entries.size >= MAX_ENTRIES && !this.entries.has(key)) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }
    this.entries.set(key, { value, expiresAt: Date.now() + TTL_MS });
  }
}
