'use client';

import * as React from 'react';
import { Reorder } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button, Input, Select, Tabs, type TabItem } from '@elevatesde/ui';
import type { AssessmentDifficulty, ProblemSummaryDto } from '@elevatesde/shared-types';
import { DIFFICULTIES, DIFFICULTY_LABEL, DIFFICULTY_ORDER } from '@/lib/difficulty';
import { ProblemRow } from './ProblemRow';

type SortKey = 'custom' | 'title' | 'difficulty' | 'unsolved';

const PAGE = 25;

const SORT_OPTIONS = [
  { value: 'custom', label: 'Default order' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'unsolved', label: 'Unsolved first' },
];

const DIFFICULTY_TABS: TabItem[] = [
  { id: 'ALL', label: 'All' },
  ...DIFFICULTIES.map((difficulty) => ({ id: difficulty, label: DIFFICULTY_LABEL[difficulty] })),
];

interface QuestionsPanelProps {
  problems: ProblemSummaryDto[];
  solvedSet: Set<string>;
  onRemove: (problemId: string) => void;
  emptyMessage: string;
  reorderable?: boolean;
  onReorder?: (orderedProblemIds: string[]) => void;
}

export function QuestionsPanel({
  problems,
  solvedSet,
  onRemove,
  emptyMessage,
  reorderable = false,
  onReorder,
}: Readonly<QuestionsPanelProps>) {
  const [query, setQuery] = React.useState('');
  const [difficulty, setDifficulty] = React.useState<AssessmentDifficulty | 'ALL'>('ALL');
  const [sort, setSort] = React.useState<SortKey>('custom');
  const [visible, setVisible] = React.useState(PAGE);
  const [order, setOrder] = React.useState<ProblemSummaryDto[]>(problems);

  React.useEffect(() => {
    setOrder(problems);
  }, [problems]);

  React.useEffect(() => {
    setVisible(PAGE);
  }, [query, difficulty, sort]);

  const isCustomView = sort === 'custom' && query.trim() === '' && difficulty === 'ALL';
  const canDrag = reorderable && isCustomView;
  const anySolved = React.useMemo(
    () => problems.some((problem) => solvedSet.has(problem.id)),
    [problems, solvedSet],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = problems.filter(
      (problem) =>
        (difficulty === 'ALL' || problem.difficulty === difficulty) &&
        (q === '' || problem.title.toLowerCase().includes(q)),
    );
    if (sort === 'title') {
      return [...arr].sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sort === 'difficulty') {
      return [...arr].sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);
    }
    if (sort === 'unsolved') {
      return [...arr].sort((a, b) => Number(solvedSet.has(a.id)) - Number(solvedSet.has(b.id)));
    }
    return arr;
  }, [problems, query, difficulty, sort, solvedSet]);

  if (problems.length === 0) {
    return (
      <div className="rounded-(--radius-md) border border-dashed border-(--color-border-subtle) px-6 py-12 text-center">
        <p className="m-0 text-sm text-(--color-text-muted)">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="md:flex-1">
          <Input
            placeholder="Search questions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="shrink-0 overflow-x-auto">
          <Tabs
            items={DIFFICULTY_TABS}
            value={difficulty}
            onChange={(value) => setDifficulty(value as AssessmentDifficulty | 'ALL')}
          />
        </div>
        <div className="w-full shrink-0 md:w-44">
          <Select
            value={sort}
            options={SORT_OPTIONS}
            onChange={(value) => setSort(value as SortKey)}
          />
        </div>
      </div>

      <p className="m-0 text-sm text-(--color-text-muted)">
        {filtered.length} of {problems.length} {problems.length === 1 ? 'question' : 'questions'}
      </p>

      {canDrag ? (
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setOrder}
          className="m-0 flex list-none flex-col gap-2 p-0"
        >
          {order.map((problem) => (
            <Reorder.Item
              key={problem.id}
              value={problem}
              onDragEnd={() => onReorder?.(order.map((item) => item.id))}
            >
              <ProblemRow
                problem={problem}
                solved={solvedSet.has(problem.id)}
                onRemove={() => onRemove(problem.id)}
                showHandle
                showStatus={anySolved}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : filtered.length === 0 ? (
        <div className="rounded-(--radius-md) border border-dashed border-(--color-border-subtle) px-6 py-10 text-center">
          <p className="m-0 text-sm text-(--color-text-muted)">No questions match your filters.</p>
        </div>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {filtered.slice(0, visible).map((problem) => (
              <li key={problem.id}>
                <ProblemRow
                  problem={problem}
                  solved={solvedSet.has(problem.id)}
                  onRemove={() => onRemove(problem.id)}
                  showStatus={anySolved}
                />
              </li>
            ))}
          </ul>
          {visible < filtered.length && (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => setVisible((count) => count + PAGE)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
