'use client';

import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import type { AdminContestSummaryDto, ContestStatus } from '@elevatesde/shared-types';
import { Badge, Toggle, type BadgeVariant } from '../../../components/ui';

const STATUS_VARIANT: Record<ContestStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  SCHEDULED: 'accent',
  LIVE: 'success',
  ENDED: 'warning',
};

const STATUS_LABEL: Record<ContestStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  LIVE: 'Live',
  ENDED: 'Ended',
};

function formatWindow(startsAt: string, endsAt: string): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  const start = new Date(startsAt).toLocaleString(undefined, options);
  const end = new Date(endsAt).toLocaleString(undefined, options);
  return `${start} → ${end}`;
}

interface ContestDirectoryProps {
  contests: AdminContestSummaryDto[];
  publishingId: string | null;
  deletingId: string | null;
  onEdit: (id: string) => void;
  onTogglePublish: (id: string, publish: boolean) => void;
  onRequestDelete: (id: string) => void;
}

export function ContestDirectory({
  contests,
  publishingId,
  deletingId,
  onEdit,
  onTogglePublish,
  onRequestDelete,
}: Readonly<ContestDirectoryProps>) {
  return (
    <div>
      <div className="hidden overflow-x-auto rounded-md border border-(--color-border-subtle) bg-(--color-surface) md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
              <th className="px-4 py-3 text-left">Contest</th>
              <th className="px-4 py-3 text-left">Window</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Problems</th>
              <th className="px-4 py-3 text-center">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {contests.map((contest) => (
              <tr
                key={contest.id}
                className="border-b border-(--color-border-subtle) last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-(--color-text-primary)">{contest.title}</div>
                  <div className="text-xs text-(--color-text-muted)">{contest.slug}</div>
                </td>
                <td className="px-4 py-3 text-(--color-text-muted)">
                  {formatWindow(contest.startsAt, contest.endsAt)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[contest.status]}>
                    {STATUS_LABEL[contest.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{contest.problemCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <Toggle
                      checked={contest.status !== 'DRAFT'}
                      disabled={publishingId === contest.id}
                      onChange={(next) => onTogglePublish(contest.id, next)}
                      label="Publish contest"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5"
                      onClick={() => onEdit(contest.id)}
                    >
                      <Pencil className="h-4 w-4 shrink-0" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5"
                      disabled={deletingId === contest.id}
                      onClick={() => onRequestDelete(contest.id)}
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {contests.map((contest) => (
          <div
            key={contest.id}
            className="flex flex-col gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-(--color-text-primary)">{contest.title}</div>
                <div className="text-xs text-(--color-text-muted)">{contest.slug}</div>
              </div>
              <Badge variant={STATUS_VARIANT[contest.status]}>{STATUS_LABEL[contest.status]}</Badge>
            </div>
            <div className="text-xs text-(--color-text-muted)">
              {formatWindow(contest.startsAt, contest.endsAt)}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-(--color-text-muted)">
                {contest.problemCount} problems
              </span>
              <Toggle
                checked={contest.status !== 'DRAFT'}
                disabled={publishingId === contest.id}
                onChange={(next) => onTogglePublish(contest.id, next)}
                label="Publish contest"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => onEdit(contest.id)}
              >
                <Pencil className="h-4 w-4 shrink-0" />
                Edit
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={deletingId === contest.id}
                onClick={() => onRequestDelete(contest.id)}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
