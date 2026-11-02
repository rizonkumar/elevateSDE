'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipContentProps,
} from 'recharts';
import type { HistogramBucketDto } from '@elevatesde/shared-types';

interface PerformanceHistogramProps {
  buckets: HistogramBucketDto[];
  ownValue: number;
  format: (value: number) => string;
  metricLabel: string;
}

interface ChartRow {
  key: string;
  range: string;
  tick: string;
  count: number;
  isOwn: boolean;
}

function ownBucketIndex(buckets: HistogramBucketDto[], value: number): number {
  if (buckets.length === 0) return -1;
  const index = buckets.findIndex((bucket) => value >= bucket.from && value < bucket.to);
  if (index >= 0) return index;
  const first = buckets[0];
  if (first && value < first.from) return 0;
  return buckets.length - 1;
}

function HistogramTooltip({ active, payload }: Readonly<TooltipContentProps>) {
  const row = payload?.[0]?.payload as ChartRow | undefined;
  if (!active || !row) return null;
  return (
    <div className="rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-surface) px-3 py-2 shadow-(--shadow-card)">
      <div className="text-xs font-semibold text-(--color-text-primary)">{row.range}</div>
      <div className="text-xs text-(--color-text-muted)">
        {row.count} {row.count === 1 ? 'user' : 'users'}
        {row.isOwn && ' · your solution'}
      </div>
    </div>
  );
}

export function PerformanceHistogram({
  buckets,
  ownValue,
  format,
  metricLabel,
}: Readonly<PerformanceHistogramProps>) {
  const ownIndex = ownBucketIndex(buckets, ownValue);
  const rows: ChartRow[] = buckets.map((bucket, index) => ({
    key: `${bucket.from}-${bucket.to}`,
    range:
      bucket.from === bucket.to
        ? format(bucket.from)
        : `${format(bucket.from)} – ${format(bucket.to)}`,
    tick:
      index === 0 || index === buckets.length - 1
        ? format(index === 0 ? bucket.from : bucket.to)
        : '',
    count: bucket.count,
    isOwn: index === ownIndex,
  }));

  return (
    <figure className="m-0">
      <div className="h-40" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 18, right: 4, left: 4, bottom: 0 }}
            barCategoryGap={2}
          >
            <XAxis
              dataKey="key"
              tickFormatter={(_, index) => rows[index]?.tick ?? ''}
              interval={0}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border-subtle)' }}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            />
            <Tooltip cursor={{ fill: 'var(--color-bg-soft)' }} content={HistogramTooltip} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} minPointSize={2} isAnimationActive={false}>
              {rows.map((row) => (
                <Cell
                  key={row.key}
                  fill={row.isOwn ? 'var(--color-accent)' : 'var(--color-badge-bg)'}
                />
              ))}
              <LabelList
                dataKey="isOwn"
                position="top"
                formatter={(value) => (value === true ? 'You' : '')}
                fill="var(--color-text-primary)"
                fontSize={11}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {metricLabel} distribution of accepted solutions. Your solution is in the{' '}
        {rows[ownIndex]?.range ?? 'unknown'} range.
        {rows.map((row) => ` ${row.range}: ${row.count}.`).join('')}
      </figcaption>
    </figure>
  );
}
