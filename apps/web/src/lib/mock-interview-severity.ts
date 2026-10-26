import type { BadgeVariant } from '@elevatesde/ui';
import type { InterviewCompetencySeverity } from '@elevatesde/shared-types';

export const SEVERITY_VARIANT: Record<InterviewCompetencySeverity, BadgeVariant> = {
  good: 'success',
  warning: 'warning',
  critical: 'danger',
};

export function severityFor(score: number): InterviewCompetencySeverity {
  if (score >= 75) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}
