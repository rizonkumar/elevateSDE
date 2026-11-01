import { PerformanceDistribution } from '../insights/performance-insights';

export abstract class IDistributionCache {
  abstract get(key: string): PerformanceDistribution | null;
  abstract set(key: string, value: PerformanceDistribution): void;
}
