'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { ContestStandingRowDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { RankBadge } from '@/components/dashboard/leaderboard/RankBadge';
import { useContestsStore } from '@/store/contests.store';
import { formatPenalty } from '@/lib/contest-time';
import { ContestStatusBadge } from '../../_components/ContestStatusBadge';

const POLL_INTERVAL_MS = 15_000;

function MemberCell({ row }: Readonly<{ row: ContestStandingRowDto }>) {
  return (
    <div className="flex items-center gap-3">
      <AuthorAvatar name={row.name} size="md" />
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-semibold text-(--color-text-primary)">{row.name}</span>
        {row.isCurrentUser && <Badge variant="accent">You</Badge>}
      </div>
    </div>
  );
}

function StandingRow({ row }: Readonly<{ row: ContestStandingRowDto }>) {
  return (
    <tr
      className={`transition-colors ${
        row.isCurrentUser ? 'bg-(--color-accent-soft)' : 'hover:bg-(--color-bg-soft)'
      }`}
    >
      <td className="px-4 py-3">
        <RankBadge rank={row.rank} />
      </td>
      <td className="px-4 py-3">
        <MemberCell row={row} />
      </td>
      <td className="px-4 py-3 text-right text-(--color-text-muted)">{row.solvedCount}</td>
      <td className="px-4 py-3 text-right font-semibold text-(--color-text-primary)">
        {row.score.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-right text-(--color-text-muted)">
        {formatPenalty(row.penaltySeconds)}
      </td>
    </tr>
  );
}

function StandingCard({ row }: Readonly<{ row: ContestStandingRowDto }>) {
  return (
    <div
      className={`rounded-md border p-4 ${
        row.isCurrentUser
          ? 'border-(--color-accent) bg-(--color-accent-soft)'
          : 'border-(--color-border-subtle) bg-(--color-surface)'
      }`}
    >
      <div className="flex items-center gap-3">
        <RankBadge rank={row.rank} />
        <div className="min-w-0 flex-1">
          <MemberCell row={row} />
        </div>
        <div className="text-right">
          <div className="font-semibold text-(--color-text-primary)">
            {row.score.toLocaleString()}
          </div>
          <div className="text-xs text-(--color-text-muted)">pts</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-(--color-text-muted)">
        <span>{row.solvedCount} solved</span>
        <span>{formatPenalty(row.penaltySeconds)} penalty</span>
      </div>
    </div>
  );
}

export default function ContestStandingsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const active = useContestsStore((state) => state.active);
  const standings = useContestsStore((state) => state.standings);
  const isStandingsLoading = useContestsStore((state) => state.isStandingsLoading);
  const loadContest = useContestsStore((state) => state.loadContest);
  const loadStandings = useContestsStore((state) => state.loadStandings);

  React.useEffect(() => {
    void loadContest(slug);
    void loadStandings(slug);
  }, [slug, loadContest, loadStandings]);

  const isLive = active?.slug === slug && active.status === 'LIVE';

  React.useEffect(() => {
    if (!isLive) {
      return;
    }
    const id = window.setInterval(() => void loadStandings(slug, true), POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isLive, slug, loadStandings]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <Link
          href={`/dashboard/contests/${slug}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to contest
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="m-0 font-display text-2xl font-semibold tracking-tight">
            {active?.slug === slug ? `${active.title} standings` : 'Standings'}
          </h1>
          {active?.slug === slug && <ContestStatusBadge status={active.status} />}
          {isLive && (
            <span className="text-xs text-(--color-text-muted)">Updates every 15 seconds</span>
          )}
        </div>

        {isStandingsLoading && standings.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Loading standings…</p>
        ) : standings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
              <Trophy className="h-5 w-5" />
            </span>
            <h2 className="m-0 font-display text-lg font-semibold">No standings yet</h2>
            <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">
              Rankings appear once the contest is live and participants are registered.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
                    <th className="px-4 py-3 font-semibold">Rank</th>
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 text-right font-semibold">Solved</th>
                    <th className="px-4 py-3 text-right font-semibold">Score</th>
                    <th className="px-4 py-3 text-right font-semibold">Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border-subtle)">
                  {standings.map((row) => (
                    <StandingRow key={row.userId} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 md:hidden">
              {standings.map((row) => (
                <StandingCard key={row.userId} row={row} />
              ))}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
