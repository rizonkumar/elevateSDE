import Link from 'next/link';
import { Activity } from 'lucide-react';
import type { StudyGroupActivityItemDto } from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { ProfileNameLink } from '@/components/public-profile/ProfileNameLink';
import { LiveIndicator } from '@/components/realtime/LiveIndicator';
import { formatRelativeTime } from '@/lib/relative-time';
import { ACTIVITY_VERB } from '@/lib/study-group-labels';
import { EmptyState } from './EmptyState';

interface GroupActivityFeedProps {
  items: StudyGroupActivityItemDto[];
  loading: boolean;
  live: boolean;
}

function Subject({ item }: Readonly<{ item: StudyGroupActivityItemDto }>) {
  const label =
    item.kind === 'DAILY_CHALLENGE' ? (
      <span className="text-(--color-text-muted)">({item.title})</span>
    ) : (
      <span className="font-medium text-(--color-text-primary)">{item.title}</span>
    );
  if (!item.linkUrl) {
    return label;
  }
  return (
    <Link
      href={item.linkUrl}
      className="rounded-(--radius-sm) underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
    >
      {label}
    </Link>
  );
}

export function GroupActivityFeed({ items, loading, live }: Readonly<GroupActivityFeedProps>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
          Recent activity
        </h2>
        <LiveIndicator live={live} fallbackLabel="Live updates paused" />
      </div>
      {loading && items.length === 0 ? (
        <div className="flex flex-col gap-2" aria-label="Loading activity">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-14 animate-pulse rounded-md bg-(--color-badge-bg)" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          compact
          icon={Activity}
          title="It is quiet in here"
          description="Solved problems, daily challenges and contest results from members will show up here as they happen."
        />
      ) : (
        <ol className="m-0 flex list-none flex-col divide-y divide-(--color-border-subtle) overflow-hidden rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-0 shadow-(--shadow-card)">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3 sm:items-center">
              <AuthorAvatar name={item.displayName} size="sm" />
              <p className="m-0 min-w-0 flex-1 text-sm leading-relaxed text-(--color-text-muted)">
                <ProfileNameLink
                  name={item.displayName}
                  publicHandle={item.publicHandle}
                  className="font-medium text-(--color-text-primary)"
                />{' '}
                {ACTIVITY_VERB[item.kind]} <Subject item={item} />
              </p>
              <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-xs font-semibold text-(--color-success)">
                  +{item.points}
                </span>
                <time dateTime={item.occurredAt} className="text-xs text-(--color-text-muted)">
                  {formatRelativeTime(item.occurredAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
