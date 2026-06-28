'use client';

import * as React from 'react';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { BadgeCard } from '@/components/dashboard/achievements/BadgeCard';
import { useAchievementsStore } from '@/store/achievements.store';

export default function AchievementsPage() {
  const view = useAchievementsStore((state) => state.view);
  const hasLoaded = useAchievementsStore((state) => state.hasLoaded);
  const fetchAchievements = useAchievementsStore((state) => state.fetchAchievements);

  React.useEffect(() => {
    void fetchAchievements();
  }, [fetchAchievements]);

  const earnedCount = view?.earned.length ?? 0;
  const totalCount = earnedCount + (view?.locked.length ?? 0);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Achievements"
          title="Your badges"
          description={
            totalCount > 0
              ? `${earnedCount} of ${totalCount} badges earned.`
              : 'Solve problems, build streaks, and post in the community to earn badges.'
          }
        />

        {totalCount > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view?.earned.map((badge) => (
              <BadgeCard key={badge.id} earned badge={badge} />
            ))}
            {view?.locked.map((badge) => (
              <BadgeCard key={badge.id} earned={false} badge={badge} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-10 text-center shadow-(--shadow-card)">
            <p className="m-0 text-sm text-(--color-text-muted)">
              {hasLoaded ? 'No badges are available yet.' : 'Loading…'}
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
