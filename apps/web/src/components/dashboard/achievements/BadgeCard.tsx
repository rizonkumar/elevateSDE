import * as React from 'react';
import { Badge } from '@elevatesde/ui';
import type { BadgeCriteriaType, LockedBadgeDto, UserBadgeDto } from '@elevatesde/shared-types';
import { resolveBadgeIcon } from './badge-icon';

const CRITERIA_LABEL: Record<BadgeCriteriaType, string> = {
  PROBLEMS_SOLVED: 'problems solved',
  STREAK_DAYS: 'day streak',
  ASSESSMENTS_COMPLETED: 'assessments completed',
  FORUM_POSTS: 'forum posts',
  POINTS: 'points',
};

type BadgeCardProps =
  | { earned: true; badge: UserBadgeDto }
  | { earned: false; badge: LockedBadgeDto };

export function BadgeCard(props: BadgeCardProps) {
  const { badge } = props;
  const Icon = resolveBadgeIcon(badge.icon);
  const criteriaLabel = CRITERIA_LABEL[badge.criteriaType];

  return (
    <div
      className={`flex flex-col gap-3 rounded-md border p-5 shadow-(--shadow-card) ${
        props.earned
          ? 'border-(--color-border-subtle) bg-(--color-surface)'
          : 'border-(--color-border-subtle) bg-(--color-bg)'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-full) ${
            props.earned
              ? 'bg-(--color-accent-soft) text-(--color-accent)'
              : 'bg-(--color-badge-bg) text-(--color-text-disabled)'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3
            className={`m-0 truncate font-display text-base font-semibold ${
              props.earned ? 'text-(--color-text-primary)' : 'text-(--color-text-muted)'
            }`}
          >
            {badge.name}
          </h3>
          {props.earned ? (
            <Badge variant="success">Earned</Badge>
          ) : (
            <span className="text-xs text-(--color-text-disabled)">Locked</span>
          )}
        </div>
      </div>

      <p className="m-0 text-sm text-(--color-text-muted)">{badge.description}</p>

      {props.earned ? (
        <div className="mt-auto text-xs text-(--color-text-muted)">
          Earned on {new Date(props.badge.awardedAt).toLocaleDateString()}
        </div>
      ) : (
        <div className="mt-auto flex flex-col gap-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-(--radius-full) bg-(--color-badge-bg)">
            <div
              className="h-full rounded-(--radius-full) bg-(--color-accent)"
              style={{ width: `${Math.min(100, (props.badge.progress / badge.threshold) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-(--color-text-muted)">
            {props.badge.progress} / {badge.threshold} {criteriaLabel}
          </div>
        </div>
      )}
    </div>
  );
}
