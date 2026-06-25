'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Flame } from 'lucide-react';
import { Badge, Button, type BadgeVariant } from '@elevatesde/ui';
import type { AssessmentDifficulty } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StreakCalendar } from '@/components/dashboard/daily/StreakCalendar';
import { useDailyChallengeStore } from '@/store/daily-challenge.store';

const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const cardClass =
  'rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-card)';

export default function DailyChallengePage() {
  const router = useRouter();
  const today = useDailyChallengeStore((state) => state.today);
  const streak = useDailyChallengeStore((state) => state.streak);
  const hasLoaded = useDailyChallengeStore((state) => state.hasLoaded);
  const fetchDaily = useDailyChallengeStore((state) => state.fetchDaily);

  React.useEffect(() => {
    void fetchDaily();
  }, [fetchDaily]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Daily Challenge"
          title="Today's challenge"
          description="Solve the daily problem to keep your streak alive."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`lg:col-span-2 ${cardClass}`}>
            {today ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={DIFFICULTY_VARIANT[today.problem.difficulty]}>
                    {today.problem.difficulty}
                  </Badge>
                  {today.completed && (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Solved today
                    </Badge>
                  )}
                </div>
                <h2 className="m-0 font-display text-xl font-semibold tracking-tight">
                  {today.problem.title}
                </h2>
                {today.problem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {today.problem.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
                  <Clock className="h-4 w-4" />
                  {today.problem.timeLimitMinutes} min
                </div>
                <div>
                  <Button onClick={() => router.push(`/dashboard/assessment/${today.problem.id}`)}>
                    {today.completed ? 'Review solution' : 'Solve challenge'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <h2 className="m-0 font-display text-lg font-semibold">No challenge today</h2>
                <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">
                  Check back soon — a new daily challenge will appear here.
                </p>
              </div>
            )}
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
                <Flame className="h-5 w-5" />
              </span>
              <div>
                <div className="font-display text-2xl font-semibold leading-none">
                  {streak?.current ?? 0}
                </div>
                <div className="text-xs text-(--color-text-muted)">day streak</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-(--color-text-muted)">
              Longest streak{' '}
              <span className="font-semibold">{streak?.longest ?? 0} days</span>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="m-0 mb-4 font-display text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Activity
          </h3>
          {streak && streak.calendar.length > 0 ? (
            <StreakCalendar cells={streak.calendar} />
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
