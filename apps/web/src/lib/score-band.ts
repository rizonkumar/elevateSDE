import type { BadgeVariant } from '@elevatesde/ui';

export interface ScoreBand {
  label: string;
  badgeVariant: BadgeVariant;
  fill: string;
}

export function scoreBand(score: number): ScoreBand {
  if (score >= 80) {
    return { label: 'Excellent', badgeVariant: 'success', fill: 'var(--color-success)' };
  }
  if (score >= 60) {
    return { label: 'Good', badgeVariant: 'accent', fill: 'var(--color-accent)' };
  }
  if (score >= 40) {
    return { label: 'Needs work', badgeVariant: 'warning', fill: 'var(--color-warning)' };
  }
  return { label: 'Poor', badgeVariant: 'danger', fill: 'var(--color-danger)' };
}
