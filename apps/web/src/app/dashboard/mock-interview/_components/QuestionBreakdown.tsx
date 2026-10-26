'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { MockInterviewRubricDimension, MockInterviewTurnDto } from '@elevatesde/shared-types';
import { SEVERITY_VARIANT, severityFor } from '@/lib/mock-interview-severity';

interface QuestionBreakdownProps {
  readonly turns: readonly MockInterviewTurnDto[];
  readonly rubric: readonly MockInterviewRubricDimension[];
}

export function QuestionBreakdown({ turns, rubric }: QuestionBreakdownProps) {
  const answered = turns.filter((turn) => turn.answer !== null);
  const [openId, setOpenId] = React.useState<string | null>(answered[0]?.id ?? null);

  if (answered.length === 0) return null;

  return (
    <div className="card flex flex-col gap-4">
      <h3 className="m-0 text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
        Question by question
      </h3>
      <ol className="m-0 flex flex-col divide-y divide-(--color-border-subtle) p-0">
        {answered.map((turn, index) => {
          const isOpen = openId === turn.id;
          const panelId = `turn-panel-${turn.id}`;
          return (
            <li key={turn.id} className="list-none py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : turn.id)}
                className="flex w-full cursor-pointer items-start gap-3 rounded-(--radius-sm) text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
              >
                <span className="mt-0.5 text-xs font-semibold tabular-nums text-(--color-text-muted)">
                  Q{index + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-(--color-text-primary)">
                  {turn.question}
                </span>
                {turn.score !== null && (
                  <Badge variant={SEVERITY_VARIANT[severityFor(turn.score)]}>{turn.score}</Badge>
                )}
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-(--color-text-muted) transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div id={panelId} className="mt-3 flex flex-col gap-3 pl-0 sm:pl-8">
                  <p className="m-0 whitespace-pre-wrap rounded-(--radius-md) bg-(--color-bg-soft) px-3.5 py-2.5 text-sm leading-relaxed text-(--color-text-primary)">
                    {turn.answer}
                  </p>
                  {turn.feedback && (
                    <p className="m-0 text-sm leading-relaxed text-(--color-text-muted)">
                      {turn.feedback}
                    </p>
                  )}
                  {turn.dimensionScores && (
                    <dl className="m-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {rubric.map((dimension) => (
                        <div
                          key={dimension.key}
                          className="rounded-(--radius-sm) border border-(--color-border-subtle) px-3 py-2"
                        >
                          <dt className="text-[11px] font-medium text-(--color-text-muted)">
                            {dimension.label}
                          </dt>
                          <dd className="m-0 text-sm font-semibold tabular-nums text-(--color-text-primary)">
                            {turn.dimensionScores?.[dimension.key] ?? '—'}
                            <span className="text-xs font-normal text-(--color-text-muted)"> / 4</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
