'use client';

import { Flame } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { LeaderboardEntryDto } from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { RankBadge } from '@/components/dashboard/leaderboard/RankBadge';

interface LeaderboardRowProps {
  entry: LeaderboardEntryDto;
}

function MemberCell({ entry }: Readonly<LeaderboardRowProps>) {
  return (
    <div className="flex items-center gap-3">
      <AuthorAvatar name={entry.name} size="md" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-(--color-text-primary)">{entry.name}</span>
          {entry.isCurrentUser && <Badge variant="accent">You</Badge>}
        </div>
        {entry.headline && (
          <div className="truncate text-xs text-(--color-text-muted)">{entry.headline}</div>
        )}
      </div>
    </div>
  );
}

function BadgeList({ badges }: Readonly<{ badges: string[] }>) {
  if (badges.length === 0) {
    return <span className="text-xs text-(--color-text-disabled)">—</span>;
  }
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {badges.map((badge) => (
        <Badge key={badge} variant="neutral">
          {badge}
        </Badge>
      ))}
    </div>
  );
}

export function LeaderboardRow({ entry }: Readonly<LeaderboardRowProps>) {
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
      <td className="px-4 py-3 text-right font-semibold text-(--color-text-primary)">
        {entry.points.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-right text-(--color-text-muted)">{entry.assessmentsCompleted}</td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center gap-1 text-(--color-text-muted)">
          <Flame className="h-3.5 w-3.5 text-(--color-warning)" />
          {entry.streakDays}d
        </span>
      </td>
      <td className="px-4 py-3">
        <BadgeList badges={entry.badges} />
      </td>
    </tr>
  );
}

export function LeaderboardCard({ entry }: Readonly<LeaderboardRowProps>) {
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
          <div className="font-semibold text-(--color-text-primary)">
            {entry.points.toLocaleString()}
          </div>
          <div className="text-xs text-(--color-text-muted)">pts</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-(--color-text-muted)">
        <span>{entry.assessmentsCompleted} assessments</span>
        <span className="inline-flex items-center gap-1">
          <Flame className="h-3.5 w-3.5 text-(--color-warning)" />
          {entry.streakDays}d streak
        </span>
      </div>
    </div>
  );
}
