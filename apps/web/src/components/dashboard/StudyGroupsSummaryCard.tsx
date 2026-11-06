'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, UsersRound } from 'lucide-react';
import { useStudyGroupsStore } from '@/store/study-groups.store';

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) px-3 py-2.5">
      <div className="font-display text-xl font-semibold text-(--color-text-primary)">
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-(--color-text-muted)">{label}</div>
    </div>
  );
}

export function StudyGroupsSummaryCard() {
  const list = useStudyGroupsStore((state) => state.list);
  const listState = useStudyGroupsStore((state) => state.listState);
  const loadList = useStudyGroupsStore((state) => state.loadList);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  const groups = list ? [...list.groups, ...list.discoverable] : [];
  const ranked = [...groups].sort((left, right) => right.memberCount - left.memberCount);
  const memberSeats = groups.reduce((sum, group) => sum + group.memberCount, 0);
  const activeGoals = groups.reduce((sum, group) => sum + group.activeGoalCount, 0);

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-(--color-accent)" />
          <h2 className="text-sm font-semibold text-(--color-text-primary)">Study groups</h2>
        </div>
        <Link
          href="/dashboard/groups"
          className="inline-flex items-center gap-1 text-xs font-medium text-(--color-accent) hover:underline"
        >
          Manage groups
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {listState === 'loading' && !list ? (
        <div className="grid animate-pulse grid-cols-3 gap-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-16 rounded-(--radius-sm) bg-(--color-badge-bg)" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="m-0 text-sm text-(--color-text-muted)">
          No groups yet. Create cohorts or teams with shared goals from the{' '}
          <Link href="/dashboard/groups" className="text-(--color-accent) hover:underline">
            study groups page
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label={groups.length === 1 ? 'Group' : 'Groups'} value={groups.length} />
            <Stat label="Memberships" value={memberSeats} />
            <Stat label="Active goals" value={activeGoals} />
          </div>
          <ul className="m-0 flex list-none flex-col divide-y divide-(--color-border-subtle) p-0">
            {ranked.slice(0, 5).map((group) => (
              <li key={group.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <Link
                  href={`/dashboard/groups/${group.id}`}
                  className="min-w-0 truncate font-medium text-(--color-text-primary) hover:text-(--color-accent)"
                >
                  {group.name}
                </Link>
                <span className="shrink-0 text-xs text-(--color-text-muted)">
                  {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'} ·{' '}
                  {group.activeGoalCount} active {group.activeGoalCount === 1 ? 'goal' : 'goals'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
