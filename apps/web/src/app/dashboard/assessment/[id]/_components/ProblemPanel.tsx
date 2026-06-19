'use client';

import * as React from 'react';
import { Badge, type BadgeVariant } from '@elevatesde/ui';
import type { AssessmentDifficulty, CodingProblemDto } from '@elevatesde/shared-types';

const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const DIFFICULTY_LABEL: Record<AssessmentDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

interface KeyedText {
  key: string;
  value: string;
}

function toKeyed(items: string[]): KeyedText[] {
  const counts = new Map<string, number>();
  return items.map((value) => {
    const seen = counts.get(value) ?? 0;
    counts.set(value, seen + 1);
    return { key: `${value}#${seen}`, value };
  });
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const counts = new Map<string, number>();
  return text.split('`').map((part, index) => {
    const isCode = index % 2 === 1;
    const tag = isCode ? 'code' : 'text';
    const occurrence = counts.get(`${tag}:${part}`) ?? 0;
    counts.set(`${tag}:${part}`, occurrence + 1);
    const key = `${keyPrefix}-${tag}-${part}#${occurrence}`;
    return isCode ? (
      <code
        key={key}
        className="rounded bg-(--color-badge-bg) px-1.5 py-0.5 font-mono text-[0.85em] text-(--color-text-primary)"
      >
        {part}
      </code>
    ) : (
      <React.Fragment key={key}>{part}</React.Fragment>
    );
  });
}

interface ProblemPanelProps {
  problem: CodingProblemDto;
}

export function ProblemPanel({ problem }: Readonly<ProblemPanelProps>) {
  const lines = toKeyed(problem.description.split('\n'));
  const constraints = toKeyed(problem.constraints);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card)">
      <div className="flex items-center gap-2 border-b border-(--color-border-subtle) px-5 py-3.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-text-muted)">
          Problem
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <h2 className="m-0 font-display text-xl font-semibold tracking-tight text-(--color-text-primary)">
            {problem.title}
          </h2>
          <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
            {DIFFICULTY_LABEL[problem.difficulty]}
          </Badge>
        </div>

        {problem.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <Badge key={tag} variant="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2 text-sm leading-relaxed text-(--color-text-muted)">
          {lines.map(({ key, value }) =>
            value.trim().length === 0 ? (
              <div key={key} className="h-1" />
            ) : (
              <p key={key} className="m-0 text-(--color-text-primary)/85">
                {renderInline(value, key)}
              </p>
            ),
          )}
        </div>

        <section className="mt-6">
          <h3 className="m-0 mb-2.5 text-sm font-semibold text-(--color-text-primary)">Examples</h3>
          <div className="space-y-3">
            {problem.examples.map((example) => (
              <div
                key={`${example.input}|${example.output}`}
                className="rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) p-3.5"
              >
                <div className="font-mono text-xs leading-relaxed text-(--color-text-primary)">
                  <span className="text-(--color-text-muted)">Input: </span>
                  {example.input}
                </div>
                <div className="mt-1 font-mono text-xs leading-relaxed text-(--color-text-primary)">
                  <span className="text-(--color-text-muted)">Output: </span>
                  {example.output}
                </div>
                {example.explanation && (
                  <div className="mt-2 text-xs text-(--color-text-muted)">{example.explanation}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="m-0 mb-2.5 text-sm font-semibold text-(--color-text-primary)">
            Constraints
          </h3>
          <ul className="m-0 list-disc space-y-1.5 pl-5 text-sm text-(--color-text-muted)">
            {constraints.map(({ key, value }) => (
              <li key={key}>{renderInline(value, key)}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
