'use client';

import * as React from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Badge, Button } from '@elevatesde/ui';
import type { ContestRatingLeaderboardEntryDto } from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { RankBadge } from '@/components/dashboard/leaderboard/RankBadge';
import { ProfileNameLink } from '@/components/public-profile/ProfileNameLink';
import { isProvisional, ratingTier } from '@/components/contest-rating/rating-tier';
import { useContestRatingStore } from '@/store/contest-rating.store';

interface EntryProps {
  entry: ContestRatingLeaderboardEntryDto;
}

function MemberCell({ entry }: Readonly<EntryProps>) {
  const tier = ratingTier(entry.rating);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AuthorAvatar name={entry.name} size="md" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <ProfileNameLink
            name={entry.name}
            publicHandle={entry.publicHandle}
            className="truncate font-semibold text-(--color-text-primary)"
          />
          {entry.isCurrentUser && <Badge variant="accent">You</Badge>}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Badge variant={tier.variant}>{tier.label}</Badge>
          {isProvisional(entry.contestsRated) && (
            <span className="text-[11px] text-(--color-text-muted)">Provisional</span>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingRow({ entry }: Readonly<EntryProps>) {
  return (
    <tr
      className={`transition-colors ${
        entry.isCurrentUser ? 'bg-(--color-accent-soft)' : 'hover:bg-(--color-bg-soft)'
      }`}
    >
      <td className="px-4 py-3">
        <RankBadge rank={entry.rank} />
      </td>
      <td className="px-4 py-3">
        <MemberCell entry={entry} />
      </td>
      <td className="px-4 py-3 text-right font-display text-base font-semibold tabular-nums text-(--color-text-primary)">
        {entry.rating}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-(--color-text-muted)">
        {entry.peakRating}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-(--color-text-muted)">
        {entry.contestsRated}
      </td>
    </tr>
  );
}

function RatingCard({ entry }: Readonly<EntryProps>) {
  return (
    <div
      className={`rounded-md border p-4 ${
        entry.isCurrentUser
          ? 'border-(--color-accent) bg-(--color-accent-soft)'
          : 'border-(--color-border-subtle) bg-(--color-surface)'
      }`}
    >
      <div className="flex items-center gap-3">
        <RankBadge rank={entry.rank} />
        <div className="min-w-0 flex-1">
          <MemberCell entry={entry} />
        </div>
        <div className="text-right">
          <div className="font-display text-lg font-semibold tabular-nums text-(--color-text-primary)">
            {entry.rating}
          </div>
          <div className="text-xs text-(--color-text-muted)">rating</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-(--color-text-muted)">
        <span>Peak {entry.peakRating}</span>
        <span>
          {entry.contestsRated} {entry.contestsRated === 1 ? 'contest' : 'contests'}
        </span>
      </div>
    </div>
  );
}

export function ContestRatingLeaderboard() {
  const scope = useContestRatingStore((state) => state.scope);
  const entries = useContestRatingStore((state) => state.entries);
  const total = useContestRatingStore((state) => state.total);
  const page = useContestRatingStore((state) => state.page);
  const isLoading = useContestRatingStore((state) => state.isLeaderboardLoading);
  const loadLeaderboard = useContestRatingStore((state) => state.loadLeaderboard);

  React.useEffect(() => {
    void loadLeaderboard(1);
  }, [scope, loadLeaderboard]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-(--color-border-subtle) bg-(--color-surface) px-6 py-16 text-center shadow-(--shadow-card)">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
          <TrendingUp className="h-5 w-5" />
        </span>
        <h2 className="m-0 font-display text-lg font-semibold">
          {isLoading ? 'Loading ratings…' : 'No ratings yet'}
        </h2>
        {!isLoading && (
          <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">
            Ratings appear after the first rated contest is finalized.{' '}
            <Link href="/dashboard/contests" className="text-(--color-accent) hover:underline">
              Browse contests
            </Link>
          </p>
        )}
      </div>
    );
  }

  const hasMore = entries.length < total;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card)">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 text-right font-semibold">Rating</th>
                <th className="px-4 py-3 text-right font-semibold">Peak</th>
                <th className="px-4 py-3 text-right font-semibold">Contests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border-subtle)">
              {entries.map((entry) => (
                <RatingRow key={entry.userId} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 p-3 md:hidden">
          {entries.map((entry) => (
            <RatingCard key={entry.userId} entry={entry} />
          ))}
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            disabled={isLoading}
            onClick={() => void loadLeaderboard(page + 1)}
          >
            {isLoading ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
