import type { JobApplicationStatus } from '@elevatesde/shared-types';
import type { BadgeVariant } from '@elevatesde/ui';

export interface BoardColumn {
  status: JobApplicationStatus;
  label: string;
  badge: BadgeVariant;
  dotClass: string;
}

export const BOARD_COLUMNS: BoardColumn[] = [
  { status: 'APPLIED', label: 'Applied', badge: 'neutral', dotClass: 'bg-(--color-text-muted)' },
  { status: 'OA', label: 'Assessment', badge: 'accent', dotClass: 'bg-(--color-accent)' },
  { status: 'INTERVIEW', label: 'Interview', badge: 'warning', dotClass: 'bg-(--color-warning)' },
  { status: 'OFFER', label: 'Offer', badge: 'success', dotClass: 'bg-(--color-success)' },
  { status: 'REJECTED', label: 'Rejected', badge: 'danger', dotClass: 'bg-(--color-danger)' },
];

export const STATUS_OPTIONS = BOARD_COLUMNS.map((column) => ({
  value: column.status,
  label: column.label,
}));

export const COLUMN_DROPPABLE_PREFIX = 'col-';

export function columnDroppableId(status: JobApplicationStatus): string {
  return `${COLUMN_DROPPABLE_PREFIX}${status}`;
}

export function isColumnDroppableId(id: string): boolean {
  return id.startsWith(COLUMN_DROPPABLE_PREFIX);
}

export function statusFromDroppableId(id: string): JobApplicationStatus {
  return id.slice(COLUMN_DROPPABLE_PREFIX.length) as JobApplicationStatus;
}
