'use client';

import * as React from 'react';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useSettingsStore } from '@/store/settings.store';
import { cardClass } from '@/lib/ui-classes';
import { ProfileForm } from './_components/ProfileForm';
import { NotificationPreferences } from './_components/NotificationPreferences';

export default function SettingsPage() {
  const profile = useSettingsStore((state) => state.profile);
  const preferences = useSettingsStore((state) => state.preferences);
  const hasLoaded = useSettingsStore((state) => state.hasLoaded);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  if (!hasLoaded || !profile) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24 text-sm text-(--color-text-muted)">
          {hasLoaded ? 'Could not load your settings.' : 'Loading…'}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Account"
          title="Settings"
          description="Manage your public profile and notification preferences."
        />

        <div className={cardClass}>
          <h2 className="m-0 mb-5 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Profile
          </h2>
          <ProfileForm profile={profile} />
        </div>

        <div className={cardClass}>
          <h2 className="m-0 mb-5 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Notifications
          </h2>
          <NotificationPreferences preferences={preferences} />
        </div>
      </div>
    </PageContainer>
  );
}
