'use client';

import * as React from 'react';
import type { ProblemSummaryDto } from '@elevatesde/shared-types';
import { RadialProgress } from '@/components/dashboard/RadialProgress';
import { DIFFICULTIES, DIFFICULTY_LABEL, DIFFICULTY_TEXT } from '@/lib/difficulty';

interface ListOverviewCardProps {
  icon: React.ComponentType<{ className?: string }>;
  titleNode: React.ReactNode;
  actions?: React.ReactNode;
  problems: ProblemSummaryDto[];
  solvedSet: Set<string>;
}

export function ListOverviewCard({
  icon: Icon,
  titleNode,
  actions,
  problems,
  solvedSet,
}: Readonly<ListOverviewCardProps>) {
  const total = problems.length;
  const solvedCount = problems.filter((problem) => solvedSet.has(problem.id)).length;
  const percent = total > 0 ? Math.round((solvedCount / total) * 100) : 0;

  const breakdown = DIFFICULTIES.map((difficulty) => {
    const inGroup = problems.filter((problem) => problem.difficulty === difficulty);
    return {
      difficulty,
      total: inGroup.length,
      solved: inGroup.filter((problem) => solvedSet.has(problem.id)).length,
    };
  });

  return (
    <div className="flex flex-col gap-6 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-sm) bg-(--color-accent-soft) text-(--color-accent)">
            <Icon className="h-5 w-5" />
          </span>
          {titleNode}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        <RadialProgress
          value={percent}
          primary={`${solvedCount}/${total}`}
          secondary="Solved"
        />
        <div className="grid w-full grid-cols-3 gap-2 sm:max-w-sm">
          {breakdown.map((group) => (
            <div
              key={group.difficulty}
              className="rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-bg-soft) px-3 py-3 text-center"
            >
              <div
                className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${DIFFICULTY_TEXT[group.difficulty]}`}
              >
                {DIFFICULTY_LABEL[group.difficulty]}
              </div>
              <div className="mt-1 font-display text-lg font-semibold text-(--color-text-primary)">
                {group.solved}
                <span className="text-(--color-text-muted)">/{group.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
