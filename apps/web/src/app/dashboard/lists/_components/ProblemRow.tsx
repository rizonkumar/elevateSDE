'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, GripVertical, X } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { ProblemSummaryDto } from '@elevatesde/shared-types';
import { DIFFICULTY_LABEL, DIFFICULTY_VARIANT } from '@/lib/difficulty';

interface ProblemRowProps {
  problem: ProblemSummaryDto;
  solved: boolean;
  onRemove: () => void;
  showHandle?: boolean;
}

export function ProblemRow({ problem, solved, onRemove, showHandle = false }: Readonly<ProblemRowProps>) {
  return (
    <div className="flex items-center gap-3 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) p-3">
      {showHandle && (
        <span
          aria-hidden="true"
          className="inline-flex cursor-grab items-center text-(--color-text-muted) active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </span>
      )}
      {solved ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-(--color-success)" aria-label="Solved" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-(--color-text-disabled)" aria-label="Not solved" />
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/assessment/${problem.id}`}
          className="block truncate text-sm font-semibold text-(--color-text-primary) transition-colors hover:text-(--color-accent)"
        >
          {problem.title}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
            {DIFFICULTY_LABEL[problem.difficulty]}
          </Badge>
          {problem.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${problem.title}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-danger) cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
