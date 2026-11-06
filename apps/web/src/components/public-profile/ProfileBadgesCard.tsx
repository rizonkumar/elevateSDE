import type { PublicProfileBadgeDto } from '@elevatesde/shared-types';
import { resolveBadgeIcon } from '@/components/dashboard/achievements/badge-icon';
import { EmptyNote, SectionCard } from './SectionCard';

function awardedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ProfileBadgesCard({
  badges,
  className,
}: {
  badges: PublicProfileBadgeDto[];
  className?: string;
}) {
  return (
    <SectionCard
      className={className}
      title="Badges"
      aside={badges.length > 0 ? `${badges.length} earned` : undefined}
    >
      {badges.length === 0 ? (
        <EmptyNote>No badges earned yet.</EmptyNote>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          {badges.map((badge) => {
            const Icon = resolveBadgeIcon(badge.icon);
            return (
              <li
                key={badge.key}
                className="flex items-start gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) p-3"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-(--color-text-primary)">
                    {badge.name}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-(--color-text-muted)">
                    {badge.description}
                  </div>
                  <div className="mt-1 text-[11px] text-(--color-text-disabled)">
                    {awardedLabel(badge.awardedAt)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
