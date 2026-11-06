import type { BadgeVariant } from '@elevatesde/ui';

export interface RatingTier {
  label: string;
  variant: BadgeVariant;
}

export const PROVISIONAL_CONTEST_THRESHOLD = 3;

const TIERS: { floor: number; tier: RatingTier }[] = [
  { floor: 2200, tier: { label: 'Grandmaster', variant: 'danger' } },
  { floor: 1900, tier: { label: 'Master', variant: 'warning' } },
  { floor: 1600, tier: { label: 'Expert', variant: 'accent' } },
  { floor: 1400, tier: { label: 'Specialist', variant: 'success' } },
];

const NEWCOMER: RatingTier = { label: 'Newcomer', variant: 'neutral' };

export function ratingTier(rating: number): RatingTier {
  return TIERS.find((entry) => rating >= entry.floor)?.tier ?? NEWCOMER;
}

export function isProvisional(contestsRated: number): boolean {
  return contestsRated < PROVISIONAL_CONTEST_THRESHOLD;
}

export function formatRatingDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }
  if (delta < 0) {
    return `−${Math.abs(delta)}`;
  }
  return '0';
}

export function ratingDeltaTone(delta: number): string {
  if (delta > 0) {
    return 'text-(--color-success)';
  }
  if (delta < 0) {
    return 'text-(--color-danger)';
  }
  return 'text-(--color-text-muted)';
}
