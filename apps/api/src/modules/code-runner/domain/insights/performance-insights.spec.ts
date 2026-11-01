import {
  BestRun,
  MIN_COMPARISON_SAMPLE,
  beatPercentage,
  buildDistribution,
  buildHistogram,
  computePercentiles,
} from './performance-insights';

function runs(runtimes: number[]): BestRun[] {
  return runtimes.map((runtimeMs, index) => ({
    userId: `u${index}`,
    runtimeMs,
    memoryKb: 1000 + index * 100,
  }));
}

describe('performance insights', () => {
  it('returns null until enough other users have solved it', () => {
    expect(beatPercentage(10, [20, 30, 40, 50])).toBeNull();
    expect(beatPercentage(10, [20, 30, 40, 50, 60])).toBe(100);
    expect(MIN_COMPARISON_SAMPLE).toBe(5);
  });

  it('counts ties as half a win', () => {
    expect(beatPercentage(30, [10, 20, 30, 40, 50])).toBe(50);
  });

  it('rounds runtimes to whole milliseconds before comparing', () => {
    const percentiles = computePercentiles(
      { runtimeMs: 12.4, memoryKb: 900 },
      runs([12.2, 11.6, 15, 16, 17]),
    );

    expect(percentiles.runtime).toBe(80);
    expect(percentiles.memory).toBe(100);
  });

  it('puts every value into a bucket including the maximum', () => {
    const histogram = buildHistogram([0, 5, 10], 2);

    expect(histogram).toEqual([
      { from: 0, to: 5, count: 1 },
      { from: 5, to: 10, count: 2 },
    ]);
  });

  it('collapses identical values into one bucket', () => {
    expect(buildHistogram([7, 7, 7])).toEqual([{ from: 7, to: 7, count: 3 }]);
    expect(buildHistogram([])).toEqual([]);
  });

  it('reports the sample size alongside both histograms', () => {
    const distribution = buildDistribution(runs([5, 10, 15]));

    expect(distribution.sampleSize).toBe(3);
    expect(distribution.runtime.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(3);
    expect(distribution.memory.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(3);
  });
});
