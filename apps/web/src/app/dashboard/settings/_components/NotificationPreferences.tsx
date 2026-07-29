'use client';

import { Award, Bell, CheckCircle2, Flame, MessageSquare, ThumbsUp } from 'lucide-react';
import { Toggle } from '@elevatesde/ui';
import type { NotificationPreferenceDto, NotificationType } from '@elevatesde/shared-types';
import { useSettingsStore } from '@/store/settings.store';

const PREFERENCE_META: Record<NotificationType, { icon: typeof Bell; label: string; description: string }> = {
  BADGE_AWARDED: {
    icon: Award,
    label: 'Badges',
    description: 'When you earn a new achievement badge.',
  },
  STREAK_MILESTONE: {
    icon: Flame,
    label: 'Streak milestones',
    description: 'When your daily-challenge streak hits a milestone.',
  },
  FORUM_REPLY: {
    icon: MessageSquare,
    label: 'Forum replies',
    description: 'When someone replies to your post.',
  },
  FORUM_UPVOTE: {
    icon: ThumbsUp,
    label: 'Forum upvotes',
    description: 'When someone upvotes your post.',
  },
  SUBMISSION_ACCEPTED: {
    icon: CheckCircle2,
    label: 'Accepted submissions',
    description: 'When your solution passes all test cases.',
  },
  SYSTEM: {
    icon: Bell,
    label: 'System announcements',
    description: 'Platform news and important updates.',
  },
};

interface NotificationPreferencesProps {
  preferences: NotificationPreferenceDto[];
}

export function NotificationPreferences({ preferences }: Readonly<NotificationPreferencesProps>) {
  const togglePreference = useSettingsStore((state) => state.togglePreference);

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {preferences.map((preference) => {
        const meta = PREFERENCE_META[preference.type];
        const Icon = meta.icon;
        return (
          <li
            key={preference.type}
            className="flex items-center justify-between gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-medium text-(--color-text-primary)">
                  {meta.label}
                </div>
                <div className="text-xs text-(--color-text-muted)">{meta.description}</div>
              </div>
            </div>
            <Toggle
              checked={preference.inAppEnabled}
              onChange={(next) => void togglePreference(preference.type, next)}
              label={`Toggle ${meta.label}`}
            />
          </li>
        );
      })}
    </ul>
  );
}
