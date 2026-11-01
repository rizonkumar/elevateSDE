'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select } from '@elevatesde/ui';
import { FlaskConical, Loader2, Search, X } from 'lucide-react';
import type {
  AssessmentDifficulty,
  CompanyDto,
  ProblemListItemDto,
  ProblemProgressStatus,
  TopicDto,
} from '@elevatesde/shared-types';
import { listProblems } from '@/lib/assessments-api';
import { listCompanies, listTopics } from '@/lib/taxonomy-api';
import { ProblemCard } from './ProblemCard';
import { TopicFilter } from './TopicFilter';

const PAGE_SIZE = 24;
const SEARCH_DEBOUNCE_MS = 400;
const ALL = 'ALL';

const DIFFICULTY_FILTERS: { value: AssessmentDifficulty | typeof ALL; label: string }[] = [
  { value: ALL, label: 'All' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const STATUS_OPTIONS: { value: ProblemProgressStatus | typeof ALL; label: string }[] = [
  { value: ALL, label: 'Any status' },
  { value: 'TODO', label: 'Not started' },
  { value: 'ATTEMPTED', label: 'Attempted' },
  { value: 'SOLVED', label: 'Solved' },
];

const DIFFICULTY_VALUES = new Set<string>(['EASY', 'MEDIUM', 'HARD']);
const STATUS_VALUES = new Set<string>(['TODO', 'ATTEMPTED', 'SOLVED']);

interface Filters {
  search: string;
  difficulty: AssessmentDifficulty | null;
  topics: string[];
  company: string | null;
  status: ProblemProgressStatus | null;
  runnableOnly: boolean;
  page: number;
}

function readFilters(params: URLSearchParams): Filters {
  const difficulty = params.get('difficulty');
  const status = params.get('status');
  const page = Number(params.get('page'));
  return {
    search: params.get('q') ?? '',
    difficulty:
      difficulty && DIFFICULTY_VALUES.has(difficulty) ? (difficulty as AssessmentDifficulty) : null,
    topics: (params.get('topics') ?? '').split(',').filter((slug) => slug.length > 0),
    company: params.get('company') || null,
    status: status && STATUS_VALUES.has(status) ? (status as ProblemProgressStatus) : null,
    runnableOnly: params.get('all') !== '1',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function writeFilters(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.topics.length > 0) params.set('topics', filters.topics.join(','));
  if (filters.company) params.set('company', filters.company);
  if (filters.status) params.set('status', filters.status);
  if (!filters.runnableOnly) params.set('all', '1');
  if (filters.page > 1) params.set('page', String(filters.page));
  return params.toString();
}

function hasActiveFilters(filters: Filters): boolean {
  return Boolean(
    filters.search ||
    filters.difficulty ||
    filters.topics.length > 0 ||
    filters.company ||
    filters.status,
  );
}

export function ProblemBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const filters = React.useMemo(() => readFilters(new URLSearchParams(queryString)), [queryString]);

  const [searchInput, setSearchInput] = React.useState(filters.search);
  const [topics, setTopics] = React.useState<TopicDto[]>([]);
  const [companies, setCompanies] = React.useState<CompanyDto[]>([]);
  const [items, setItems] = React.useState<ProblemListItemDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const applyFilters = React.useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filters, page: 1, ...patch };
      const query = writeFilters(next);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  React.useEffect(() => {
    void Promise.all([listTopics(), listCompanies()])
      .then(([topicList, companyList]) => {
        setTopics(topicList);
        setCompanies(companyList);
      })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  React.useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === filters.search) return;
    const timer = setTimeout(() => applyFilters({ search: trimmed }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, applyFilters]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    listProblems({
      page: filters.page,
      pageSize: PAGE_SIZE,
      search: filters.search || undefined,
      difficulty: filters.difficulty ?? undefined,
      hasTestCases: filters.runnableOnly || undefined,
      topics: filters.topics,
      company: filters.company ?? undefined,
      status: filters.status ?? undefined,
    })
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const companyOptions = [
    { value: ALL, label: 'Any company' },
    ...companies.map((company) => ({ value: company.slug, label: company.name })),
  ];

  const emptyMessage = filters.runnableOnly
    ? 'No runnable problems match these filters. Turn off “Runnable only” to browse the full bank.'
    : 'No problems match these filters.';

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
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search problems…"
            aria-label="Search problems"
            className="w-full rounded-md border border-(--color-border-subtle) bg-(--color-surface) py-2 pl-9 pr-3 text-sm text-(--color-text-primary) outline-none transition-colors focus:border-(--color-accent)"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyFilters({ runnableOnly: !filters.runnableOnly })}
            aria-pressed={filters.runnableOnly}
            className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              filters.runnableOnly
                ? 'bg-(--color-accent-soft) text-(--color-accent)'
                : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Runnable only
          </button>
          {DIFFICULTY_FILTERS.map((option) => {
            const active = (filters.difficulty ?? ALL) === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  applyFilters({ difficulty: option.value === ALL ? null : option.value })
                }
                className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-(--color-badge-bg) text-(--color-text-primary)'
                    : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <TopicFilter
          topics={topics}
          selected={filters.topics}
          onChange={(slugs) => applyFilters({ topics: slugs })}
        />
        {companies.length > 0 && (
          <Select
            value={filters.company ?? ALL}
            options={companyOptions}
            onChange={(value) => applyFilters({ company: value === ALL ? null : value })}
            className="w-44"
          />
        )}
        <Select
          value={filters.status ?? ALL}
          options={STATUS_OPTIONS}
          onChange={(value) =>
            applyFilters({ status: value === ALL ? null : (value as ProblemProgressStatus) })
          }
          className="w-40"
        />
        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              applyFilters({
                search: '',
                difficulty: null,
                topics: [],
                company: null,
                status: null,
              });
            }}
            className="inline-flex items-center gap-1 rounded-sm px-2.5 py-1.5 text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary) cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
        {filters.company && (
          <span className="text-xs text-(--color-text-muted)">
            Ordered by how often this company asks them
          </span>
        )}
      </div>

      {renderResults()}

      {!loading && !error && items.length > 0 && (
        <div className="mt-8 flex items-center justify-between gap-4">
          <span className="text-xs text-(--color-text-muted)">
            {total.toLocaleString()} problems · page {filters.page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyFilters({ page: Math.max(1, filters.page - 1) })}
              disabled={filters.page <= 1}
              className="rounded-sm border border-(--color-border-subtle) px-3 py-1.5 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => applyFilters({ page: Math.min(totalPages, filters.page + 1) })}
              disabled={filters.page >= totalPages}
              className="rounded-sm border border-(--color-border-subtle) px-3 py-1.5 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
