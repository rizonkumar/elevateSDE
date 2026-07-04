'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { AdminBadgeDto } from '@elevatesde/shared-types';
import { Toggle } from '../../../components/ui';
import { CRITERIA_LABEL } from './badge-criteria';

interface BadgeDirectoryProps {
  badges: AdminBadgeDto[];
  togglingId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export function BadgeDirectory({
  badges,
  togglingId,
  onEdit,
  onDelete,
  onToggleActive,
}: Readonly<BadgeDirectoryProps>) {
  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-border-subtle) bg-(--color-surface) p-10 text-center">
        <p className="text-sm text-(--color-text-muted)">No badges defined yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
              <th className="px-6 py-4">Badge</th>
              <th className="px-6 py-4">Criteria</th>
              <th className="px-6 py-4">Threshold</th>
              <th className="px-6 py-4">Awarded</th>
              <th className="px-6 py-4">Active</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border-subtle)">
            {badges.map((badge) => (
              <tr key={badge.id} className="transition-colors hover:bg-(--color-bg-soft)/50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-(--color-text-primary)">{badge.name}</div>
                  <div className="font-mono text-xs text-(--color-text-muted)">
                    {badge.key} · {badge.icon}
                  </div>
                </td>
                <td className="px-6 py-4 text-(--color-text-muted)">
                  {CRITERIA_LABEL[badge.criteriaType]}
                </td>
                <td className="px-6 py-4 text-(--color-text-muted)">{badge.threshold}</td>
                <td className="px-6 py-4 text-(--color-text-muted)">{badge.awardCount}</td>
                <td className="px-6 py-4">
                  <Toggle
                    checked={badge.isActive}
                    disabled={togglingId === badge.id}
                    onChange={() => onToggleActive(badge.id)}
                    label={`Toggle active for ${badge.name}`}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      aria-label={`Edit ${badge.name}`}
                      onClick={() => onEdit(badge.id)}
                      className="cursor-pointer rounded-md p-2 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)"
                    >
                      <Pencil className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${badge.name}`}
                      onClick={() => onDelete(badge.id)}
                      className="cursor-pointer rounded-md p-2 text-(--color-text-muted) transition-colors hover:bg-(--color-danger-soft) hover:text-(--color-danger)"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex flex-col gap-3 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-(--color-text-primary)">{badge.name}</div>
                <div className="font-mono text-xs text-(--color-text-muted)">
                  {badge.key} · {badge.icon}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-(--color-text-muted)">
                Active
                <Toggle
                  checked={badge.isActive}
                  disabled={togglingId === badge.id}
                  onChange={() => onToggleActive(badge.id)}
                  label={`Toggle active for ${badge.name}`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-(--color-text-muted)">
              <span>{CRITERIA_LABEL[badge.criteriaType]}</span>
              <span>
                Threshold {badge.threshold} · {badge.awardCount} awarded
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onEdit(badge.id)}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border border-(--color-border-subtle) px-3 py-2 text-xs font-semibold text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
              >
                <Pencil className="h-3.5 w-3.5 shrink-0" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(badge.id)}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border border-(--color-border-subtle) px-3 py-2 text-xs font-semibold text-(--color-text-muted) transition-colors hover:bg-(--color-danger-soft) hover:text-(--color-danger)"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
