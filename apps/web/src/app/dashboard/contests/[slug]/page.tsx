'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle, ListChecks, Lock, Trophy, Users } from 'lucide-react';
import { Badge, Button, type BadgeVariant } from '@elevatesde/ui';
import type { AssessmentDifficulty, ContestDetailDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { useContestsStore } from '@/store/contests.store';
import { formatContestDate, formatContestDuration } from '@/lib/contest-time';
import { ContestStatusBadge } from '../_components/ContestStatusBadge';
import { ContestCountdown } from '../_components/ContestCountdown';

const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const cardClass =
  'rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-card)';

function ProblemList({ contest }: Readonly<{ contest: ContestDetailDto }>) {
  if (contest.status === 'SCHEDULED') {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
          <Lock className="h-5 w-5" />
        </span>
        <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">
          {contest.problemCount} problems unlock when the contest goes live.
        </p>
      </div>
    );
  }
  if (contest.problems.length === 0) {
    return <p className="m-0 text-sm text-(--color-text-muted)">No problems in this contest.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {contest.problems.map((problem) => (
        <li key={problem.id}>
          <Link
            href={`/dashboard/assessment/${problem.problemId}`}
            className="flex items-center gap-3 rounded-lg border border-(--color-border-subtle) bg-(--color-bg) px-4 py-3 transition-colors hover:border-(--color-border)"
          >
            {problem.solved ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-(--color-accent)" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-(--color-text-muted)" />
            )}
            <span className="flex-1 truncate text-sm font-medium text-(--color-text-primary)">
              {problem.title}
            </span>
            <span className="text-xs font-semibold tabular-nums text-(--color-text-muted)">
              {problem.points} pts
            </span>
            <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>{problem.difficulty}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ContestDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const active = useContestsStore((state) => state.active);
  const isDetailLoading = useContestsStore((state) => state.isDetailLoading);
  const isRegistering = useContestsStore((state) => state.isRegistering);
  const loadContest = useContestsStore((state) => state.loadContest);
  const register = useContestsStore((state) => state.register);

  React.useEffect(() => {
    void loadContest(slug);
  }, [slug, loadContest]);

  if (isDetailLoading && !active) {
    return (
      <PageContainer>
        <p className="text-sm text-(--color-text-muted)">Loading contest…</p>
      </PageContainer>
    );
  }

  if (!active) {
    return (
      <PageContainer>
        <div className="flex flex-col items-start gap-4">
          <Link
            href="/dashboard/contests"
            className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to contests
          </Link>
          <p className="m-0 text-sm text-(--color-text-muted)">This contest is unavailable.</p>
        </div>
      </PageContainer>
    );
  }

  const canRegister = !active.registered && active.status !== 'ENDED';
  const showStandings = active.status !== 'SCHEDULED';

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <Link
          href="/dashboard/contests"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to contests
        </Link>

        <div className={cardClass}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <ContestStatusBadge status={active.status} />
              {active.registered && <Badge variant="accent">Registered</Badge>}
            </div>
            <h1 className="m-0 font-display text-2xl font-semibold tracking-tight">
              {active.title}
            </h1>
            <p className="m-0 max-w-2xl text-sm text-(--color-text-muted)">{active.description}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-(--color-text-muted)">
              <ContestCountdown
                status={active.status}
                startsAt={active.startsAt}
                endsAt={active.endsAt}
              />
              <span>
                {formatContestDate(active.startsAt)} ·{' '}
                {formatContestDuration(active.startsAt, active.endsAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {active.participantCount} registered
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {canRegister && (
                <Button onClick={() => void register(slug)} disabled={isRegistering}>
                  {isRegistering ? 'Registering…' : 'Register'}
                </Button>
              )}
              {showStandings && (
                <Link href={`/dashboard/contests/${slug}/standings`}>
                  <Button variant="secondary">
                    <Trophy className="h-4 w-4" />
                    Standings
                  </Button>
                </Link>
              )}
            </div>

            {active.status === 'LIVE' && !active.registered && (
              <p className="m-0 text-xs text-(--color-text-muted)">
                Register to appear on the standings. Only accepted submissions made during the
                contest window count.
              </p>
            )}
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="m-0 mb-4 inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <ListChecks className="h-5 w-5 text-(--color-accent)" />
            Problems
          </h2>
          <ProblemList contest={active} />
        </div>
      </div>
    </PageContainer>
  );
}
