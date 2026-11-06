'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import type { ContestRatingHistoryEntryDto } from '@elevatesde/shared-types';
import { formatRatingDelta, ratingDeltaTone } from './rating-tier';

interface RatingHistoryChartProps {
  history: ContestRatingHistoryEntryDto[];
  linkContests: boolean;
}

interface ChartPoint {
  index: number;
  slug: string;
  title: string;
  date: string;
  rank: number;
  rating: number;
  delta: number;
}

const TIER_BOUNDARIES = [1400, 1600, 1900, 2200];
const DOMAIN_PADDING = 40;
const DOMAIN_STEP = 50;
const TICK_STEPS = [50, 100, 200, 250, 500, 1000];
const MAX_TICKS = 6;

function axisTicks(low: number, high: number): number[] {
  const step = TICK_STEPS.find((candidate) => (high - low) / candidate <= MAX_TICKS - 1) ?? 1000;
  const ticks: number[] = [];
  for (let tick = Math.ceil(low / step) * step; tick <= high; tick += step) {
    ticks.push(tick);
  }
  return ticks;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function RatingTooltip({ active, payload }: Readonly<TooltipContentProps>) {
  const point = payload?.[0]?.payload as ChartPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="max-w-56 rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-surface) px-3 py-2 shadow-(--shadow-card)">
      <div className="truncate text-xs font-semibold text-(--color-text-primary)">
        {point.title}
      </div>
      <div className="mt-0.5 text-[11px] text-(--color-text-muted)">
        {longDate(point.date)} · Rank #{point.rank}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2 text-xs">
        <span className="font-semibold tabular-nums text-(--color-text-primary)">
          {point.rating}
        </span>
        <span className={`font-semibold tabular-nums ${ratingDeltaTone(point.delta)}`}>
          {formatRatingDelta(point.delta)}
        </span>
      </div>
    </div>
  );
}

export function RatingHistoryChart({ history, linkContests }: Readonly<RatingHistoryChartProps>) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const points: ChartPoint[] = history.map((entry, index) => ({
    index,
    slug: entry.slug,
    title: entry.title,
    date: entry.endsAt,
    rank: entry.rank,
    rating: entry.newRating,
    delta: entry.delta,
  }));
  const ratings = points.map((point) => point.rating);
  const low = Math.max(
    0,
    Math.floor((Math.min(...ratings) - DOMAIN_PADDING) / DOMAIN_STEP) * DOMAIN_STEP,
  );
  const high = Math.ceil((Math.max(...ratings) + DOMAIN_PADDING) / DOMAIN_STEP) * DOMAIN_STEP;
  const boundaries = TIER_BOUNDARIES.filter((boundary) => boundary > low && boundary < high);

  const openContest = (index: number) => {
    const point = points[index];
    if (point) {
      router.push(`/dashboard/contests/${point.slug}/standings`);
    }
  };

  return (
    <figure className="m-0">
      <div className="h-48 sm:h-56" aria-hidden="true">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              className={linkContests ? 'cursor-pointer' : undefined}
              onClick={(state) => {
                const index = Number(state.activeTooltipIndex);
                if (linkContests && Number.isInteger(index)) {
                  openContest(index);
                }
              }}
            >
              <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" />
              {boundaries.map((boundary) => (
                <ReferenceLine
                  key={boundary}
                  y={boundary}
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                />
              ))}
              <XAxis
                dataKey="index"
                tickFormatter={(value: number) => {
                  const point = points[value];
                  return point ? shortDate(point.date) : '';
                }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border-subtle)' }}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                domain={[low, high]}
                ticks={axisTicks(low, high)}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: 'var(--color-border)' }}
                content={RatingTooltip}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--color-surface)', stroke: 'var(--color-accent)' }}
                activeDot={{ r: 5, fill: 'var(--color-accent)', stroke: 'var(--color-surface)' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <figcaption className="sr-only">
        Contest rating over {points.length} rated contests.
        {points.map((point) => ` ${point.title}: ${point.rating}.`).join('')}
      </figcaption>
    </figure>
  );
}
