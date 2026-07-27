'use client';

import * as React from 'react';
import { CheckCircle2, Library, Repeat, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ContributionHeatmap } from '@/components/dashboard/profile/ContributionHeatmap';
import { ReviewForecast } from '@/components/dashboard/review/ReviewForecast';
import { ReviewQueueCard } from '@/components/dashboard/review/ReviewQueueCard';
import { useReviewStore } from '@/store/review.store';

const cardClass =
  'rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-card)';

interface ReviewStatProps {
  icon: LucideIcon;
  value: number;
  label: string;
}

function ReviewStat({ icon: Icon, value, label }: Readonly<ReviewStatProps>) {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="font-display text-2xl font-semibold leading-none tabular-nums">
            {value}
          </div>
          <div className="text-xs text-(--color-text-muted)">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const due = useReviewStore((state) => state.due);
  const summary = useReviewStore((state) => state.summary);
  const heatmap = useReviewStore((state) => state.heatmap);
  const hasLoaded = useReviewStore((state) => state.hasLoaded);
  const gradingProblemId = useReviewStore((state) => state.gradingProblemId);
  const loadDue = useReviewStore((state) => state.loadDue);
  const grade = useReviewStore((state) => state.grade);

  React.useEffect(() => {
    void loadDue();
  }, [loadDue]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Practice"
          title="Review Queue"
          description="Spaced repetition resurfaces problems you have solved right before you would forget them. Rate your recall to schedule the next review."
        />

        <div className="grid gap-6 sm:grid-cols-3">
          <ReviewStat icon={Repeat} value={summary?.dueCount ?? 0} label="due today" />
          <ReviewStat icon={Library} value={summary?.trackedCount ?? 0} label="problems tracked" />
          <ReviewStat icon={Sparkles} value={summary?.reviewedCount ?? 0} label="reviewed so far" />
        </div>

        {due.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {due.map((item) => (
              <ReviewQueueCard
                key={item.problem.id}
                item={item}
                isGrading={gradingProblemId === item.problem.id}
                onGrade={(quality) => void grade(item.problem.id, quality)}
              />
            ))}
          </div>
        ) : (
          <div className={cardClass}>
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              {hasLoaded ? (
                <>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--color-success-soft) text-(--color-success)">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <h2 className="m-0 font-display text-lg font-semibold">
                    Nothing due today — you&apos;re all caught up.
                  </h2>
                  <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">
                    Solve problems in the code editor and they will come back here on a forgetting
                    curve.
                  </p>
                </>
              ) : (
                <p className="m-0 text-sm text-(--color-text-muted)">Loading…</p>
              )}
            </div>
          </div>
        )}

        <div className={cardClass}>
          <h3 className="m-0 mb-4 font-display text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
            Upcoming reviews
          </h3>
          {summary && summary.forecast.length > 0 ? (
            <ReviewForecast days={summary.forecast} />
          ) : (
            <p className="m-0 text-sm text-(--color-text-muted)">
              {hasLoaded ? 'Nothing scheduled yet.' : 'Loading…'}
            </p>
          )}
        </div>

        <div className={cardClass}>
          <h3 className="m-0 mb-4 font-display text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
            Practice activity
          </h3>
          {heatmap && heatmap.cells.length > 0 ? (
            <ContributionHeatmap cells={heatmap.cells} />
          ) : (
            <p className="m-0 text-sm text-(--color-text-muted)">
              {hasLoaded ? 'No activity yet.' : 'Loading…'}
            </p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
