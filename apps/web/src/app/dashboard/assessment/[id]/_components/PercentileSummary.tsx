import { Gauge, MemoryStick } from 'lucide-react';
import type { SubmissionPercentiles } from '@/store/assessment.store';

function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

export function PercentileSummary({
  percentiles,
}: Readonly<{ percentiles: SubmissionPercentiles }>) {
  if (percentiles.runtime === null && percentiles.memory === null) {
    return (
      <p className="m-0 text-xs text-(--color-text-muted)">
        Not enough accepted solutions in this language to compare yet.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {percentiles.runtime !== null && (
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-(--color-border-subtle) bg-(--color-bg-soft) px-2.5 py-1.5 text-(--color-text-primary)">
          <Gauge className="h-3.5 w-3.5 text-(--color-accent)" aria-hidden="true" />
          Faster than{' '}
          <strong className="font-semibold">{formatPercent(percentiles.runtime)}</strong>
        </span>
      )}
      {percentiles.memory !== null && (
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-(--color-border-subtle) bg-(--color-bg-soft) px-2.5 py-1.5 text-(--color-text-primary)">
          <MemoryStick className="h-3.5 w-3.5 text-(--color-accent)" aria-hidden="true" />
          Less memory than{' '}
          <strong className="font-semibold">{formatPercent(percentiles.memory)}</strong>
        </span>
      )}
      <span className="self-center text-(--color-text-muted)">Approximate, versus other users</span>
    </div>
  );
}
