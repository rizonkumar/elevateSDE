'use client';

import * as React from 'react';
import { BookOpenCheck, FileText, MessagesSquare, StickyNote } from 'lucide-react';
import { Badge, Tabs, type BadgeVariant, type TabItem } from '@elevatesde/ui';
import type { AssessmentDifficulty, CodingProblemDto } from '@elevatesde/shared-types';
import { useProblemSocialStore } from '@/store/problem-social.store';
import { BookmarkToggle } from './BookmarkToggle';
import { AddToListMenu } from './AddToListMenu';
import { DiscussionTab } from './DiscussionTab';
import { NotesTab } from './NotesTab';
import { HintsSection } from './HintsSection';
import { EditorialTab } from './EditorialTab';
import { ParagraphText, renderInline, toKeyed } from './problem-text';

type ProblemTab = 'description' | 'editorial' | 'discuss' | 'notes';

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

function DescriptionView({ problem }: Readonly<{ problem: CodingProblemDto }>) {
  const constraints = toKeyed(problem.constraints);

  return (
    <>
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

      <ParagraphText text={problem.description} />

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

      <HintsSection problemId={problem.id} />
    </>
  );
}

interface ProblemPanelProps {
  problem: CodingProblemDto;
}

export function ProblemPanel({ problem }: Readonly<ProblemPanelProps>) {
  const [tab, setTab] = React.useState<ProblemTab>('description');
  const discussionCount = useProblemSocialStore(
    (state) => (state.discussions[problem.id] ?? []).length,
  );

  const tabs: TabItem[] = [
    { id: 'description', label: 'Description', icon: FileText },
    { id: 'editorial', label: 'Editorial', icon: BookOpenCheck },
    { id: 'discuss', label: 'Discuss', icon: MessagesSquare, count: discussionCount },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card)">
      <div className="flex items-center justify-between gap-2 border-b border-(--color-border-subtle) px-4 py-2.5">
        <Tabs
          items={tabs}
          value={tab}
          onChange={(id) => setTab(id as ProblemTab)}
          variant="plain"
        />
        <div className="flex items-center gap-2">
          <BookmarkToggle problemId={problem.id} />
          <AddToListMenu problemId={problem.id} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {tab === 'description' && <DescriptionView problem={problem} />}
        {tab === 'editorial' && <EditorialTab problemId={problem.id} />}
        {tab === 'discuss' && <DiscussionTab problemId={problem.id} />}
        {tab === 'notes' && <NotesTab problemId={problem.id} />}
      </div>
    </div>
  );
}
