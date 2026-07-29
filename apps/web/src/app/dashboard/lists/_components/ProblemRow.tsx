'use client';

import Link from 'next/link';
import { CheckCircle2, GripVertical, X } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { ProblemSummaryDto } from '@elevatesde/shared-types';
import { DIFFICULTY_LABEL, DIFFICULTY_VARIANT } from '@/lib/difficulty';

interface ProblemRowProps {
  problem: ProblemSummaryDto;
  solved: boolean;
  onRemove?: () => void;
  showHandle?: boolean;
  showStatus?: boolean;
}

export function ProblemRow({
  problem,
  solved,
  onRemove,
  showHandle = false,
  showStatus = false,
}: Readonly<ProblemRowProps>) {
  return (
    <div className="flex items-center gap-2.5 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) px-3.5 py-3">
      {showHandle && (
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 cursor-grab items-center text-(--color-text-disabled) transition-colors hover:text-(--color-text-muted) active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </span>
      )}
      {showStatus &&
        (solved ? (
          <CheckCircle2
            className="h-[18px] w-[18px] shrink-0 text-(--color-success)"
            aria-label="Solved"
          />
        ) : (
          <span className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        ))}
      <div className="ml-1 min-w-0 flex-1">
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
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${problem.title}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-danger) cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
