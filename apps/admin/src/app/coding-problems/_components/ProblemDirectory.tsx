'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { AdminProblemSummaryDto, AssessmentDifficulty } from '@elevatesde/shared-types';
import { Badge, type BadgeVariant, Toggle } from '../../../components/ui';

interface ProblemDirectoryProps {
  problems: AdminProblemSummaryDto[];
  togglingId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
}

const DIFFICULTY_LABEL: Record<AssessmentDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

function TagList({ tags }: Readonly<{ tags: string[] }>) {
  if (tags.length === 0) {
    return <span className="text-xs text-(--color-text-muted)">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) px-2 py-0.5 text-[11px] font-medium text-(--color-text-muted)"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function ProblemDirectory({
  problems,
  togglingId,
  onEdit,
  onDelete,
  onTogglePublish,
}: Readonly<ProblemDirectoryProps>) {
  if (problems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-(--color-border-subtle) bg-(--color-surface) p-10 text-center">
        <p className="text-sm text-(--color-text-muted)">No coding problems match your filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Difficulty</th>
              <th className="px-6 py-4">Tags</th>
              <th className="px-6 py-4">Test cases</th>
              <th className="px-6 py-4">Published</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border-subtle)">
            {problems.map((problem) => (
              <tr key={problem.id} className="transition-colors hover:bg-(--color-bg-soft)/50">
                <td className="px-6 py-4 font-semibold text-(--color-text-primary)">
                  {problem.title}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
                    {DIFFICULTY_LABEL[problem.difficulty]}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <TagList tags={problem.tags} />
                </td>
                <td className="px-6 py-4 text-(--color-text-muted)">{problem.testCaseCount}</td>
                <td className="px-6 py-4">
                  <Toggle
                    checked={problem.isPublished}
                    disabled={togglingId === problem.id}
                    onChange={() => onTogglePublish(problem.id)}
                    label={`Toggle published for ${problem.title}`}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      aria-label={`Edit ${problem.title}`}
                      onClick={() => onEdit(problem.id)}
                      className="cursor-pointer rounded-md p-2 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)"
                    >
                      <Pencil className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${problem.title}`}
                      onClick={() => onDelete(problem.id)}
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
        {problems.map((problem) => (
          <div
            key={problem.id}
            className="flex flex-col gap-3 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold text-(--color-text-primary)">{problem.title}</span>
              <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
                {DIFFICULTY_LABEL[problem.difficulty]}
              </Badge>
            </div>
            <TagList tags={problem.tags} />
            <div className="flex items-center justify-between gap-3 text-xs text-(--color-text-muted)">
              <span>{problem.testCaseCount} test cases</span>
              <div className="flex items-center gap-2">
                <span>Published</span>
                <Toggle
                  checked={problem.isPublished}
                  disabled={togglingId === problem.id}
                  onChange={() => onTogglePublish(problem.id)}
                  label={`Toggle published for ${problem.title}`}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onEdit(problem.id)}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm border border-(--color-border-subtle) px-3 py-2 text-xs font-semibold text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
              >
                <Pencil className="h-3.5 w-3.5 shrink-0" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(problem.id)}
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
