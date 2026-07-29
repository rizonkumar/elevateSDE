import type { UserBadgeDto } from '@elevatesde/shared-types';
import { BadgeChip } from '@/components/dashboard/achievements/BadgeChip';

interface PublicBadgeGridProps {
  badges: UserBadgeDto[];
}

export function PublicBadgeGrid({ badges }: Readonly<PublicBadgeGridProps>) {
  if (badges.length === 0) {
    return <p className="m-0 text-sm text-(--color-text-muted)">No badges earned yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <BadgeChip key={badge.id} badge={badge} />
      ))}
    </div>
  );
}
