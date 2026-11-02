'use client';

import * as React from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { CompanyDto, ProblemListItemDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { listProblems } from '@/lib/assessments-api';
import { getCompany } from '@/lib/taxonomy-api';
import { DIFFICULTY_LABEL, DIFFICULTY_VARIANT } from '@/lib/difficulty';
import { ProgressMark } from '../../assessment/_components/ProgressMark';
import { ProgressRing } from '../_components/ProgressRing';

const PAGE_SIZE = 50;

type LoadState = 'LOADING' | 'READY' | 'NOT_FOUND' | 'ERROR';

function FrequencyBar({ value }: Readonly<{ value: number }>) {
  const filled = Math.max(1, Math.round(value / 20));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Frequency ${value} of 100`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={`h-3 w-1.5 rounded-full ${
            step <= filled ? 'bg-(--color-accent)' : 'bg-(--color-badge-bg)'
          }`}
        />
      ))}
    </span>
  );
}

export default function CompanyDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? (params.slug[0] ?? '') : params.slug;

  const [company, setCompany] = React.useState<CompanyDto | null>(null);
  const [problems, setProblems] = React.useState<ProblemListItemDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [state, setState] = React.useState<LoadState>('LOADING');
  const [loadingMore, setLoadingMore] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setState('LOADING');
    Promise.all([getCompany(slug), listProblems({ company: slug, page: 1, pageSize: PAGE_SIZE })])
      .then(([companyData, list]) => {
        if (!active) return;
        setCompany(companyData);
        setProblems(list.items);
        setTotal(list.total);
        setPage(1);
        setState('READY');
      })
      .catch((error: unknown) => {
        if (!active) return;
        const notFound = axios.isAxiosError(error) && error.response?.status === 404;
        setState(notFound ? 'NOT_FOUND' : 'ERROR');
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await listProblems({ company: slug, page: page + 1, pageSize: PAGE_SIZE });
      setProblems((current) => [...current, ...next.items]);
      setPage((current) => current + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const backLink = (
    <Link
      href="/dashboard/companies"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
    >
      <ArrowLeft className="h-4 w-4" />
      All companies
    </Link>
  );

  if (state === 'LOADING') {
    return (
      <PageContainer>
        {backLink}
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-(--color-text-muted)">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading questions…
        </div>
      </PageContainer>
    );
  }

  if (state !== 'READY' || !company) {
    return (
      <PageContainer>
        {backLink}
        <div className="py-24 text-center text-sm text-(--color-text-muted)">
          {state === 'NOT_FOUND'
            ? 'We could not find questions for that company.'
            : 'Could not load this company. Please refresh and try again.'}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {backLink}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Company questions
          </p>
          <h1 className="mt-1 mb-0 font-display text-3xl font-semibold tracking-tight text-(--color-text-primary)">
            {company.name}
          </h1>
          <p className="mt-2 mb-0 text-sm text-(--color-text-muted)">
            Ranked by how often {company.name} asks them in interviews.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-surface) px-4 py-3 shadow-(--shadow-card)">
          <ProgressRing solved={company.solvedCount} total={company.problemCount} />
          <div>
            <p className="m-0 text-sm font-semibold text-(--color-text-primary)">
              {company.solvedCount} / {company.problemCount}
            </p>
            <p className="m-0 text-xs text-(--color-text-muted)">solved</p>
          </div>
        </div>
      </div>

      <ol className="m-0 list-none divide-y divide-(--color-border-subtle) overflow-hidden rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-0 shadow-(--shadow-card)">
        {problems.map((problem, index) => {
          const frequency =
            problem.companies.find((entry) => entry.slug === company.slug)?.frequency ?? 0;
          return (
            <li key={problem.id}>
              <Link
                href={`/dashboard/assessment/${problem.id}`}
                className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-(--color-bg-soft) sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="w-7 shrink-0 text-right font-mono text-xs text-(--color-text-muted)">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-(--color-text-primary)">
                    {problem.title}
                  </span>
                </span>
                <span className="flex items-center gap-4 pl-10 sm:pl-0">
                  <ProgressMark status={problem.status} />
                  <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
                    {DIFFICULTY_LABEL[problem.difficulty]}
                  </Badge>
                  <FrequencyBar value={frequency} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {problems.length < total && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-sm border border-(--color-border-subtle) px-4 py-2 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            Show more ({total - problems.length} left)
          </button>
        </div>
      )}
    </PageContainer>
  );
}
