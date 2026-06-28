'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BadgeChip } from '@/components/dashboard/achievements/BadgeChip';
import { useAchievementsStore } from '@/store/achievements.store';

const cardClass =
  'rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-card)';

export function ProfileAchievements() {
  const view = useAchievementsStore((state) => state.view);
  const hasLoaded = useAchievementsStore((state) => state.hasLoaded);
  const fetchAchievements = useAchievementsStore((state) => state.fetchAchievements);

  React.useEffect(() => {
    void fetchAchievements();
  }, [fetchAchievements]);

  const earned = view?.earned ?? [];
  const total = earned.length + (view?.locked.length ?? 0);

  return (
    <div className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h3 className="m-0 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Achievements
          </h3>
          {total > 0 && (
            <span className="text-xs text-(--color-text-muted)">
              {earned.length} of {total} earned
            </span>
          )}
        </div>
        <Link
          href="/dashboard/achievements"
          className="inline-flex items-center gap-1 text-xs font-semibold text-(--color-accent) hover:underline"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {earned.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {earned.map((badge) => (
            <BadgeChip key={badge.id} badge={badge} />
          ))}
        </div>
      ) : (
        <p className="m-0 text-sm text-(--color-text-muted)">
          {hasLoaded
            ? 'No badges earned yet — solve a problem to get started.'
            : 'Loading…'}
        </p>
      )}
    </div>
  );
}
