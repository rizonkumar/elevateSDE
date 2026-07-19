import { Badge, type BadgeVariant } from '@elevatesde/ui';
import type { ContestStatus } from '@elevatesde/shared-types';

const STATUS_VARIANT: Record<ContestStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  SCHEDULED: 'warning',
  LIVE: 'success',
  ENDED: 'neutral',
};

const STATUS_LABEL: Record<ContestStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Upcoming',
  LIVE: 'Live',
  ENDED: 'Ended',
};

export function ContestStatusBadge({ status }: Readonly<{ status: ContestStatus }>) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
