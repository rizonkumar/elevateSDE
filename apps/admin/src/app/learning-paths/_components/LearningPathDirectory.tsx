'use client';

import Link from 'next/link';
import { ListTree, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import type { AdminLearningPathSummaryDto, PathLevel } from '@elevatesde/shared-types';
import { Badge, Toggle, type BadgeVariant } from '../../../components/ui';

const LEVEL_VARIANT: Record<PathLevel, BadgeVariant> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'accent',
  ADVANCED: 'warning',
};

const LEVEL_LABEL: Record<PathLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

interface LearningPathDirectoryProps {
  paths: AdminLearningPathSummaryDto[];
  publishingId: string | null;
  deletingId: string | null;
  onEdit: (id: string) => void;
  onTogglePublish: (id: string, publish: boolean) => void;
  onRequestDelete: (id: string) => void;
}

export function LearningPathDirectory({
  paths,
  publishingId,
  deletingId,
  onEdit,
  onTogglePublish,
  onRequestDelete,
}: Readonly<LearningPathDirectoryProps>) {
  return (
    <div>
      <div className="hidden overflow-x-auto rounded-md border border-(--color-border-subtle) bg-(--color-surface) md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
              <th className="px-4 py-3 text-left">Path</th>
              <th className="px-4 py-3 text-left">Level</th>
              <th className="px-4 py-3 text-right">Modules</th>
              <th className="px-4 py-3 text-right">Problems</th>
              <th className="px-4 py-3 text-center">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paths.map((path) => (
              <tr key={path.id} className="border-b border-(--color-border-subtle) last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold text-(--color-text-primary)">{path.title}</div>
                  <div className="text-xs text-(--color-text-muted)">{path.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={LEVEL_VARIANT[path.level]}>{LEVEL_LABEL[path.level]}</Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{path.moduleCount}</td>
                <td className="px-4 py-3 text-right tabular-nums">{path.problemCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <Toggle
                      checked={path.isPublished}
                      disabled={publishingId === path.id}
                      onChange={(next) => onTogglePublish(path.id, next)}
                      label="Publish learning path"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/learning-paths/${path.id}`}>
                      <Button type="button" variant="secondary" className="px-2.5">
                        <ListTree className="h-4 w-4 shrink-0" />
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5"
                      onClick={() => onEdit(path.id)}
                    >
                      <Pencil className="h-4 w-4 shrink-0" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5"
                      disabled={deletingId === path.id}
                      onClick={() => onRequestDelete(path.id)}
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
        {paths.map((path) => (
          <div
            key={path.id}
            className="flex flex-col gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-(--color-text-primary)">{path.title}</div>
                <div className="text-xs text-(--color-text-muted)">{path.slug}</div>
              </div>
              <Badge variant={LEVEL_VARIANT[path.level]}>{LEVEL_LABEL[path.level]}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-(--color-text-muted)">
                {path.moduleCount} modules · {path.problemCount} problems
              </span>
              <Toggle
                checked={path.isPublished}
                disabled={publishingId === path.id}
                onChange={(next) => onTogglePublish(path.id, next)}
                label="Publish learning path"
              />
            </div>
            <div className="flex gap-2">
              <Link href={`/learning-paths/${path.id}`} className="flex-1">
                <Button type="button" variant="secondary" className="w-full">
                  <ListTree className="h-4 w-4 shrink-0" />
                  Build
                </Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => onEdit(path.id)}
              >
                <Pencil className="h-4 w-4 shrink-0" />
                Edit
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={deletingId === path.id}
                onClick={() => onRequestDelete(path.id)}
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
