'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge, type BadgeVariant } from '@elevatesde/ui';
import { ArrowRight, Clock, FlaskConical, Loader2, Search } from 'lucide-react';
import type { AssessmentDifficulty, ProblemSummaryDto } from '@elevatesde/shared-types';
import { listProblems } from '@/lib/assessments-api';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';

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

const DIFFICULTY_FILTERS: { value: AssessmentDifficulty | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const PAGE_SIZE = 24;

export default function AssessmentIndexPage() {
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [difficulty, setDifficulty] = React.useState<AssessmentDifficulty | 'ALL'>('ALL');
  const [runnableOnly, setRunnableOnly] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<ProblemSummaryDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    listProblems({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      difficulty: difficulty === 'ALL' ? undefined : difficulty,
      hasTestCases: runnableOnly || undefined,
    })
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, difficulty, runnableOnly]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const emptyMessage = runnableOnly
    ? 'No runnable problems match your search. Turn off “Runnable only” to browse the full bank.'
    : 'No problems match your search.';

  const renderResults = (): React.ReactNode => {
    if (loading) {
      return (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-(--color-text-muted)">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading problems…
        </div>
      );
    }
    if (error) {
      return (
        <div className="py-24 text-center text-sm text-(--color-danger)">
          Could not load problems. Please refresh and try again.
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="py-24 text-center text-sm text-(--color-text-muted)">{emptyMessage}</div>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((problem) => (
          <Link
            key={problem.id}
            href={`/dashboard/assessment/${problem.id}`}
            className="group flex flex-col rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) transition-colors hover:border-(--color-accent)"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="m-0 font-display text-lg font-semibold tracking-tight text-(--color-text-primary)">
                {problem.title}
              </h2>
              <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
                {DIFFICULTY_LABEL[problem.difficulty]}
              </Badge>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {problem.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="neutral">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between text-xs text-(--color-text-muted)">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {problem.timeLimitMinutes} min
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-(--color-accent)">
                Solve
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        kicker="Code editor"
        title="Coding Assessments"
        description="Solve real interview problems in a full IDE with a Monaco editor. Pick a problem, write your solution, and run it against test cases."
        className="mb-8"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search problems…"
            className="w-full rounded-md border border-(--color-border-subtle) bg-(--color-surface) py-2 pl-9 pr-3 text-sm text-(--color-text-primary) outline-none transition-colors focus:border-(--color-accent)"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setRunnableOnly((value) => !value);
              setPage(1);
            }}
            aria-pressed={runnableOnly}
            className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              runnableOnly
                ? 'bg-(--color-accent-soft) text-(--color-accent)'
                : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Runnable only
          </button>
          {DIFFICULTY_FILTERS.map((filter) => {
            const active = filter.value === difficulty;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setDifficulty(filter.value);
                  setPage(1);
                }}
                className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-(--color-badge-bg) text-(--color-text-primary)'
                    : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {renderResults()}

      {!loading && !error && items.length > 0 && (
        <div className="mt-8 flex items-center justify-between gap-4">
          <span className="text-xs text-(--color-text-muted)">
            {total.toLocaleString()} problems · page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="rounded-sm border border-(--color-border-subtle) px-3 py-1.5 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              className="rounded-sm border border-(--color-border-subtle) px-3 py-1.5 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
