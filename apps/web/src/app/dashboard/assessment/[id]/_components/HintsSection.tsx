'use client';

import * as React from 'react';
import { Lightbulb, Loader2, Lock } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import { useProblemAssistanceStore } from '@/store/problem-assistance.store';
import { renderInline } from './problem-text';

interface HintsSectionProps {
  problemId: string;
}

export function HintsSection({ problemId }: Readonly<HintsSectionProps>) {
  const assistance = useProblemAssistanceStore((state) => state.assistance[problemId]);
  const isRevealing = useProblemAssistanceStore((state) => state.isRevealing);
  const fetchAssistance = useProblemAssistanceStore((state) => state.fetchAssistance);
  const revealHint = useProblemAssistanceStore((state) => state.revealHint);

  React.useEffect(() => {
    void fetchAssistance(problemId);
  }, [problemId, fetchAssistance]);

  if (!assistance || assistance.totalHints === 0) {
    return null;
  }

  const revealedCount = assistance.hints.length;
  const nextOrdinal = revealedCount + 1;
  const hasMore = revealedCount < assistance.totalHints;

  return (
    <section className="mt-6" aria-labelledby="problem-hints-heading">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3
          id="problem-hints-heading"
          className="m-0 flex items-center gap-1.5 text-sm font-semibold text-(--color-text-primary)"
        >
          <Lightbulb className="h-4 w-4 text-(--color-text-muted)" />
          Hints
        </h3>
        <span className="text-xs text-(--color-text-muted)">
          {revealedCount} of {assistance.totalHints} revealed
        </span>
      </div>

      {assistance.lockedByContest ? (
        <p className="m-0 flex items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) p-3 text-xs text-(--color-text-muted)">
          <Lock className="h-3.5 w-3.5" />
          Hints are locked while you are competing in a live contest with this problem.
        </p>
      ) : (
        <div className="space-y-2.5">
          {assistance.hints.map((hint) => (
            <div
              key={hint.ordinal}
              className="rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) p-3.5"
            >
              <div className="mb-1 text-xs font-semibold text-(--color-text-muted)">
                Hint {hint.ordinal}
              </div>
              <p className="m-0 text-sm leading-relaxed text-(--color-text-primary)/85">
                {renderInline(hint.content, `hint-${hint.ordinal}`)}
              </p>
            </div>
          ))}
          {hasMore && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void revealHint(problemId)}
              disabled={isRevealing}
              className="w-full sm:w-auto"
            >
              {isRevealing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-1.5 h-4 w-4" />
              )}
              Reveal hint {nextOrdinal} of {assistance.totalHints}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
