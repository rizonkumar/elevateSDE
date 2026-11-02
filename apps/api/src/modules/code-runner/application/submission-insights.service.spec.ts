import { AssessmentLanguage } from '@prisma/client';
import { ISubmissionRepository } from '../domain/interfaces/submission-repository.interface';
import { IDistributionCache } from '../domain/interfaces/distribution-cache.interface';
import { BestRun, PerformanceDistribution } from '../domain/insights/performance-insights';
import { SubmissionInsightsService } from './submission-insights.service';

const OTHERS: BestRun[] = [10, 30, 40, 50, 60].map((runtimeMs, index) => ({
  userId: `u${index}`,
  runtimeMs,
  memoryKb: 3000,
}));

class MapCache implements IDistributionCache {
  store = new Map<string, PerformanceDistribution>();
  get(key: string): PerformanceDistribution | null {
    return this.store.get(key) ?? null;
  }
  set(key: string, value: PerformanceDistribution): void {
    this.store.set(key, value);
  }
}

function build() {
  const findBestAcceptedRuns = jest.fn().mockResolvedValue(OTHERS);
  const repository = { findBestAcceptedRuns } as unknown as ISubmissionRepository;
  const cache = new MapCache();
  return {
    service: new SubmissionInsightsService(repository, cache),
    findBestAcceptedRuns,
    cache,
  };
}

describe('SubmissionInsightsService', () => {
  it('compares a run against the best run of every other user', async () => {
    const { service, findBestAcceptedRuns } = build();

    const percentiles = await service.percentilesFor({
      userId: 'me',
      problemId: 'p1',
      language: 'python',
      runtimeMs: 20,
      memoryKb: 2000,
    });

    expect(findBestAcceptedRuns).toHaveBeenCalledWith('p1', AssessmentLanguage.PYTHON, 'me');
    expect(percentiles).toEqual({ runtime: 80, memory: 100 });
  });

  it('caches the distribution per problem and language', async () => {
    const { service, findBestAcceptedRuns } = build();

    const first = await service.getDistribution('p1', 'python');
    const second = await service.getDistribution('p1', 'python');
    await service.getDistribution('p1', 'cpp');

    expect(second).toBe(first);
    expect(first.sampleSize).toBe(5);
    expect(findBestAcceptedRuns).toHaveBeenCalledTimes(2);
    expect(findBestAcceptedRuns).toHaveBeenCalledWith('p1', AssessmentLanguage.PYTHON, null);
  });
});
