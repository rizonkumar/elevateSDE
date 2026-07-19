'use client';

import * as React from 'react';
import Link from 'next/link';
import { ListChecks, Swords, Users } from 'lucide-react';
import { Badge, Tabs, type TabItem } from '@elevatesde/ui';
import type { ContestStatus, ContestSummaryDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useContestsStore } from '@/store/contests.store';
import { formatContestDate, formatContestDuration } from '@/lib/contest-time';
import { ContestStatusBadge } from './_components/ContestStatusBadge';
import { ContestCountdown } from './_components/ContestCountdown';

type ContestTab = 'upcoming' | 'live' | 'past';

const TAB_STATUS: Record<ContestTab, ContestStatus> = {
  upcoming: 'SCHEDULED',
  live: 'LIVE',
  past: 'ENDED',
};

const EMPTY_MESSAGE: Record<ContestTab, string> = {
  upcoming: 'No upcoming contests are scheduled right now.',
  live: 'No contest is live at the moment.',
  past: 'Past contests will appear here once they finish.',
};

const cardClass =
  'flex flex-col gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-card) transition-colors hover:border-(--color-border)';

function ContestCard({ contest }: Readonly<{ contest: ContestSummaryDto }>) {
  return (
    <Link href={`/dashboard/contests/${contest.slug}`} className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 font-display text-lg font-semibold tracking-tight">{contest.title}</h2>
        <ContestStatusBadge status={contest.status} />
      </div>
      <ContestCountdown
        status={contest.status}
        startsAt={contest.startsAt}
        endsAt={contest.endsAt}
      />
      <p className="m-0 text-sm text-(--color-text-muted)">
        {formatContestDate(contest.startsAt)} ·{' '}
        {formatContestDuration(contest.startsAt, contest.endsAt)}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-(--color-text-muted)">
        <span className="inline-flex items-center gap-1.5">
          <ListChecks className="h-4 w-4" />
          {contest.problemCount} problems
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {contest.participantCount} registered
        </span>
        {contest.registered && <Badge variant="accent">Registered</Badge>}
      </div>
    </Link>
  );
}

export default function ContestsPage() {
  const contests = useContestsStore((state) => state.contests);
  const isLoading = useContestsStore((state) => state.isLoading);
  const loadContests = useContestsStore((state) => state.loadContests);
  const [tab, setTab] = React.useState<ContestTab>('upcoming');

  React.useEffect(() => {
    void loadContests();
  }, [loadContests]);

  const countByStatus = (status: ContestStatus) =>
    contests.filter((contest) => contest.status === status).length;

  const tabs: TabItem[] = [
    { id: 'upcoming', label: 'Upcoming', count: countByStatus('SCHEDULED') },
    { id: 'live', label: 'Live', count: countByStatus('LIVE') },
    { id: 'past', label: 'Past', count: countByStatus('ENDED') },
  ];

  const visible = contests.filter((contest) => contest.status === TAB_STATUS[tab]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Contests"
          title="Coding contests"
          description="Compete on timed problem sets and climb the live standings."
        />

        <Tabs items={tabs} value={tab} onChange={(id) => setTab(id as ContestTab)} />

        {isLoading && contests.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Loading contests…</p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
              <Swords className="h-5 w-5" />
            </span>
            <h2 className="m-0 font-display text-lg font-semibold">Nothing here yet</h2>
            <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">{EMPTY_MESSAGE[tab]}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
