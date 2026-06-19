'use client';

import { TrendingUp, ClipboardCheck, Flame } from 'lucide-react';
import { Button, Tabs, type TabItem } from '@elevatesde/ui';
import type { LeaderboardTimeframe } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LeaderboardPodium } from '@/components/dashboard/leaderboard/LeaderboardPodium';
import { LeaderboardRow, LeaderboardCard } from '@/components/dashboard/leaderboard/LeaderboardRow';
import { useLeaderboardStore } from '@/store/leaderboard.store';
import { getLeaderboardEntries } from '@/lib/leaderboard-data';

const TIMEFRAME_TABS: TabItem[] = [
  { id: 'all-time', label: 'All time' },
  { id: 'monthly', label: 'This month' },
  { id: 'weekly', label: 'This week' },
];

export default function LeaderboardPage() {
  const timeframe = useLeaderboardStore((state) => state.timeframe);
  const visibleCount = useLeaderboardStore((state) => state.visibleCount);
  const setTimeframe = useLeaderboardStore((state) => state.setTimeframe);
  const loadMore = useLeaderboardStore((state) => state.loadMore);

  const entries = getLeaderboardEntries(timeframe);
  const podium = entries.slice(0, 3);
  const currentUser = entries.find((entry) => entry.isCurrentUser);
  const rows = entries.slice(0, visibleCount);
  const hasMore = visibleCount < entries.length;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Leaderboard"
          title="Top performers"
          description="See how your preparation stacks up against the community across assessments, streaks, and contributions."
          actions={
            <Tabs
              items={TIMEFRAME_TABS}
              value={timeframe}
              onChange={(id) => setTimeframe(id as LeaderboardTimeframe)}
            />
          }
        />

        {currentUser && (
          <div className="rounded-md border border-(--color-accent) bg-(--color-accent-soft) p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-(--color-accent)">
                  Your standing
                </div>
                <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-(--color-text-primary)">
                  Rank #{currentUser.rank}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Points
                  </div>
                  <div className="mt-1 font-semibold text-(--color-text-primary)">
                    {currentUser.points.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Assessments
                  </div>
                  <div className="mt-1 font-semibold text-(--color-text-primary)">
                    {currentUser.assessmentsCompleted}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-(--color-text-muted)">
                    <Flame className="h-3.5 w-3.5" />
                    Streak
                  </div>
                  <div className="mt-1 font-semibold text-(--color-text-primary)">
                    {currentUser.streakDays}d
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <LeaderboardPodium entries={podium} />

        <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card)">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
                  <th className="px-4 py-3 font-semibold">Rank</th>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 text-right font-semibold">Points</th>
                  <th className="px-4 py-3 text-right font-semibold">Assessments</th>
                  <th className="px-4 py-3 text-right font-semibold">Streak</th>
                  <th className="px-4 py-3 text-right font-semibold">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border-subtle)">
                {rows.map((entry) => (
                  <LeaderboardRow key={entry.userId} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 p-3 md:hidden">
            {rows.map((entry) => (
              <LeaderboardCard key={entry.userId} entry={entry} />
            ))}
          </div>
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={loadMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
