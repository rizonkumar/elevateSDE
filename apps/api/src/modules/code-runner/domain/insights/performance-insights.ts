export const MIN_COMPARISON_SAMPLE = 5;
export const HISTOGRAM_BUCKETS = 20;

export interface BestRun {
  userId: string;
  runtimeMs: number;
  memoryKb: number;
}

export interface HistogramBucket {
  from: number;
  to: number;
  count: number;
}

export interface PerformanceDistribution {
  sampleSize: number;
  runtime: HistogramBucket[];
  memory: HistogramBucket[];
}

export interface PerformancePercentiles {
  runtime: number | null;
  memory: number | null;
}

export function normalizeRuntime(runtimeMs: number): number {
  return Math.round(runtimeMs);
}

export function beatPercentage(mine: number, others: number[]): number | null {
  if (others.length < MIN_COMPARISON_SAMPLE) {
    return null;
  }
  let worse = 0;
  let ties = 0;
  for (const other of others) {
    if (other > mine) {
      worse += 1;
    } else if (other === mine) {
      ties += 1;
    }
  }
  const share = (worse + ties / 2) / others.length;
  return Math.round(share * 1000) / 10;
}

export function computePercentiles(
  own: { runtimeMs: number; memoryKb: number },
  others: BestRun[],
): PerformancePercentiles {
  return {
    runtime: beatPercentage(
      normalizeRuntime(own.runtimeMs),
      others.map((run) => normalizeRuntime(run.runtimeMs)),
    ),
    memory: beatPercentage(
      own.memoryKb,
      others.map((run) => run.memoryKb),
    ),
  };
}

export function buildHistogram(
  values: number[],
  bucketCount: number = HISTOGRAM_BUCKETS,
): HistogramBucket[] {
  if (values.length === 0) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ from: min, to: max, count: values.length }];
  }
  const width = (max - min) / bucketCount;
  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, index) => ({
    from: min + width * index,
    to: index === bucketCount - 1 ? max : min + width * (index + 1),
    count: 0,
  }));
  for (const value of values) {
    const index = Math.min(Math.floor((value - min) / width), bucketCount - 1);
    const bucket = buckets[index];
    if (bucket) {
      bucket.count += 1;
    }
  }
  return buckets;
}

export function buildDistribution(runs: BestRun[]): PerformanceDistribution {
  return {
    sampleSize: runs.length,
    runtime: buildHistogram(runs.map((run) => normalizeRuntime(run.runtimeMs))),
    memory: buildHistogram(runs.map((run) => run.memoryKb)),
  };
}
