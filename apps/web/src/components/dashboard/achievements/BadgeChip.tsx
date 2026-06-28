import * as React from 'react';
import type { UserBadgeDto } from '@elevatesde/shared-types';
import { resolveBadgeIcon } from './badge-icon';

interface BadgeChipProps {
  badge: UserBadgeDto;
}

export function BadgeChip({ badge }: BadgeChipProps) {
  const Icon = resolveBadgeIcon(badge.icon);
  return (
    <div
      className="flex items-center gap-2 rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-bg-soft) py-1 pl-1.5 pr-3"
      title={badge.description}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium text-(--color-text-primary)">{badge.name}</span>
    </div>
  );
}
