import * as React from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { ContestRatingSummaryDto } from '@elevatesde/shared-types';
import { RatingDelta } from './RatingDelta';
import { RatingHistoryChart } from './RatingHistoryChart';
import { isProvisional, ratingTier } from './rating-tier';

interface RatingCardProps {
  summary: ContestRatingSummaryDto | null;
  emptyMessage?: string;
  linkContests?: boolean;
  className?: string;
}

const RECENT_LIMIT = 3;

function Stat({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wider text-(--color-text-muted)">
        {label}
      </div>
      <div className="mt-1 font-display text-base font-semibold tabular-nums text-(--color-text-primary)">
        {children}
      </div>
    </div>
  );
}

function RatingEmptyState({ message }: Readonly<{ message: string }>) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-(--color-border) px-4 py-8 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
        <TrendingUp className="h-5 w-5" />
      </span>
      <p className="m-0 max-w-xs text-sm text-(--color-text-muted)">{message}</p>
    </div>
  );
}

export function RatingCard({
  summary,
  emptyMessage = 'Compete in a rated contest to get your first rating.',
  linkContests = true,
  className = '',
}: Readonly<RatingCardProps>) {
  const hasRating = summary !== null && summary.contestsRated > 0;
  const recent = hasRating ? [...summary.history].reverse().slice(0, RECENT_LIMIT) : [];
  const latest = recent[0];
  const tier = hasRating ? ratingTier(summary.rating) : null;

  return (
    <section
      className={`rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6 ${className}`.trim()}
    >
      <h2 className="m-0 mb-4 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
        Contest rating
      </h2>

      {!hasRating || !tier ? (
        <RatingEmptyState message={emptyMessage} />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={tier.variant}>{tier.label}</Badge>
                {isProvisional(summary.contestsRated) && (
                  <Badge variant="neutral">Provisional</Badge>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-4xl font-semibold leading-none tracking-tight tabular-nums text-(--color-text-primary)">
                  {summary.rating}
                </span>
                {latest && <RatingDelta delta={latest.delta} className="text-sm" />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:flex sm:gap-8">
              <Stat label="Peak">{summary.peakRating}</Stat>
              <Stat label="Contests">{summary.contestsRated}</Stat>
            </div>
          </div>

          <RatingHistoryChart history={summary.history} linkContests={linkContests} />

          <div>
            <h3 className="m-0 mb-2 text-xs font-semibold text-(--color-text-muted)">
              Recent contests
            </h3>
            <ul className="m-0 flex list-none flex-col divide-y divide-(--color-border-subtle) p-0">
              {recent.map((entry) => {
                const label = (
                  <>
                    <span className="min-w-0 flex-1 truncate font-medium text-(--color-text-primary)">
                      {entry.title}
                    </span>
                    <span className="shrink-0 text-xs text-(--color-text-muted) tabular-nums">
                      #{entry.rank}
                    </span>
                    <span className="w-12 shrink-0 text-right tabular-nums text-(--color-text-muted)">
                      {entry.newRating}
                    </span>
                    <RatingDelta delta={entry.delta} className="w-12 shrink-0 text-right" />
                  </>
                );
                return (
                  <li key={entry.contestId}>
                    {linkContests ? (
                      <Link
                        href={`/dashboard/contests/${entry.slug}/standings`}
                        className="-mx-2 flex items-center gap-3 rounded-(--radius-sm) px-2 py-2.5 text-sm transition-colors hover:bg-(--color-bg-soft)"
                      >
                        {label}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 py-2.5 text-sm">{label}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
