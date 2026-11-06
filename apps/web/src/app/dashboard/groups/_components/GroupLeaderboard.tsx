'use client';

import { Trophy } from 'lucide-react';
import { Badge, Tabs, type TabItem } from '@elevatesde/ui';
import type {
  StudyGroupLeaderboardDto,
  StudyGroupLeaderboardEntryDto,
  StudyGroupLeaderboardWindow,
} from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { ProfileNameLink } from '@/components/public-profile/ProfileNameLink';
import { WINDOW_LABEL, formatShortDate } from '@/lib/study-group-labels';
import { EmptyState } from './EmptyState';

const WINDOW_TABS: TabItem[] = (Object.keys(WINDOW_LABEL) as StudyGroupLeaderboardWindow[]).map(
  (window) => ({ id: window, label: WINDOW_LABEL[window] }),
);

interface GroupLeaderboardProps {
  leaderboard: StudyGroupLeaderboardDto | null;
  window: StudyGroupLeaderboardWindow;
  loading: boolean;
  onWindowChange: (window: StudyGroupLeaderboardWindow) => void;
}

function windowCaption(leaderboard: StudyGroupLeaderboardDto): string {
  if (leaderboard.window === 'goal' && leaderboard.goalTitle && leaderboard.from && leaderboard.to) {
    return `${leaderboard.goalTitle} · ${formatShortDate(leaderboard.from)} – ${formatShortDate(leaderboard.to)}`;
  }
  if (leaderboard.window === 'week' && leaderboard.from) {
    return `Since Monday, ${formatShortDate(leaderboard.from)}`;
  }
  return 'Every point earned since joining the platform';
}

function RankBadge({ rank }: Readonly<{ rank: number }>) {
  const podium = rank <= 3;
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-(--radius-full) px-2 text-xs font-semibold ${
        podium
          ? 'bg-(--color-accent-soft) text-(--color-accent)'
          : 'bg-(--color-badge-bg) text-(--color-text-muted)'
      }`}
    >
      {rank}
    </span>
  );
}

function rowTone(entry: StudyGroupLeaderboardEntryDto): string {
  return entry.isViewer ? 'bg-(--color-accent-soft)' : '';
}

function NameCell({ entry }: Readonly<{ entry: StudyGroupLeaderboardEntryDto }>) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AuthorAvatar name={entry.displayName} size="sm" />
      <ProfileNameLink
        name={entry.displayName}
        publicHandle={entry.publicHandle}
        className="truncate text-sm font-medium text-(--color-text-primary)"
      />
      {entry.isViewer && <Badge variant="accent">You</Badge>}
    </div>
  );
}

type LeaderboardView = 'loading' | 'empty' | 'table';

function resolveLeaderboardView(
  loading: boolean,
  leaderboard: StudyGroupLeaderboardDto | null,
): LeaderboardView {
  if (!leaderboard) {
    return loading ? 'loading' : 'empty';
  }
  return leaderboard.entries.length === 0 ? 'empty' : 'table';
}

export function GroupLeaderboard({
  leaderboard,
  window,
  loading,
  onWindowChange,
}: Readonly<GroupLeaderboardProps>) {
  const fellBack = leaderboard?.window === 'week' && window === 'goal';
  const view = resolveLeaderboardView(loading, leaderboard);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-full overflow-x-auto [scrollbar-width:none]">
          <Tabs
            items={WINDOW_TABS}
            value={window}
            onChange={(id) => onWindowChange(id as StudyGroupLeaderboardWindow)}
          />
        </div>
        {leaderboard && (
          <p className="m-0 text-xs text-(--color-text-muted)">
            {fellBack ? 'No goal is running, showing this week. ' : ''}
            {windowCaption(leaderboard)}
          </p>
        )}
      </div>

      {view === 'loading' && (
        <div className="flex flex-col gap-2" aria-label="Loading leaderboard">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-12 animate-pulse rounded-md bg-(--color-badge-bg)" />
          ))}
        </div>
      )}

      {view === 'empty' && (
        <EmptyState
          compact
          icon={Trophy}
          title="No one to rank yet"
          description="Add members to the group and their points will appear here."
        />
      )}

      {view === 'table' && leaderboard && (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="hidden overflow-hidden rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
                  <th className="w-20 px-4 py-3 font-semibold">Rank</th>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 text-right font-semibold">Solved</th>
                  <th className="px-4 py-3 text-right font-semibold">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border-subtle)">
                {leaderboard.entries.map((entry) => (
                  <tr key={entry.userId} className={rowTone(entry)}>
                    <td className="px-4 py-3">
                      <RankBadge rank={entry.rank} />
                    </td>
                    <td className="max-w-0 px-4 py-3">
                      <NameCell entry={entry} />
                    </td>
                    <td className="px-4 py-3 text-right text-(--color-text-muted)">
                      {entry.problemsSolved.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-(--color-text-primary)">
                      {entry.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 md:hidden">
            {leaderboard.entries.map((entry) => (
              <li
                key={entry.userId}
                className={`flex items-center gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-surface) px-3 py-3 ${rowTone(entry)}`}
              >
                <RankBadge rank={entry.rank} />
                <div className="min-w-0 flex-1">
                  <NameCell entry={entry} />
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-(--color-text-primary)">
                    {entry.points.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-(--color-text-muted)">
                    {entry.problemsSolved} solved
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
