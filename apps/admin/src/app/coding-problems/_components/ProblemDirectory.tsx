'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { AdminCodingProblemDto, AssessmentDifficulty } from '@elevatesde/shared-types';
import { Badge, type BadgeVariant, Toggle } from '../../../components/ui';

interface ProblemDirectoryProps {
  problems: AdminCodingProblemDto[];
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
          className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-(--color-badge-bg) text-(--color-text-muted) border border-(--color-border-subtle)"
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
      <div className="hidden md:block overflow-x-auto rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
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
              <tr key={problem.id} className="hover:bg-(--color-bg-soft)/50 transition-colors">
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
                <td className="px-6 py-4 text-(--color-text-muted)">{problem.testCases.length}</td>
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
                      className="p-2 rounded-md text-(--color-text-muted) hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${problem.title}`}
                      onClick={() => onDelete(problem.id)}
                      className="p-2 rounded-md text-(--color-text-muted) hover:bg-(--color-danger-soft) hover:text-(--color-danger) transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        {problems.map((problem) => (
          <div
            key={problem.id}
            className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold text-(--color-text-primary)">{problem.title}</span>
              <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
                {DIFFICULTY_LABEL[problem.difficulty]}
              </Badge>
            </div>
            <TagList tags={problem.tags} />
            <div className="flex items-center justify-between gap-3 text-xs text-(--color-text-muted)">
              <span>{problem.testCases.length} test cases</span>
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
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-(--radius-sm) border border-(--color-border-subtle) text-(--color-text-primary) hover:bg-(--color-badge-bg) transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(problem.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-(--radius-sm) border border-(--color-border-subtle) text-(--color-text-muted) hover:bg-(--color-danger-soft) hover:text-(--color-danger) transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
