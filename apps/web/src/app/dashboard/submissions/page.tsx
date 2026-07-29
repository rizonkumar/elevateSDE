'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Select } from '@elevatesde/ui';
import type { AssessmentLanguage, SubmissionStatusValue } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useSubmissionsStore, SUBMISSIONS_PAGE_SIZE } from '@/store/submissions.store';
import { SubmissionRow } from './_components/SubmissionRow';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'WRONG_ANSWER', label: 'Wrong answer' },
  { value: 'RUNTIME_ERROR', label: 'Runtime error' },
  { value: 'TIME_LIMIT_EXCEEDED', label: 'Time limit exceeded' },
  { value: 'COMPILE_ERROR', label: 'Compile error' },
];

const LANGUAGE_OPTIONS = [
  { value: '', label: 'All languages' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
];

export default function SubmissionsPage() {
  const items = useSubmissionsStore((state) => state.items);
  const total = useSubmissionsStore((state) => state.total);
  const page = useSubmissionsStore((state) => state.page);
  const filters = useSubmissionsStore((state) => state.filters);
  const isLoading = useSubmissionsStore((state) => state.isLoading);
  const hasLoaded = useSubmissionsStore((state) => state.hasLoaded);
  const setPage = useSubmissionsStore((state) => state.setPage);
  const setFilters = useSubmissionsStore((state) => state.setFilters);
  const fetchSubmissions = useSubmissionsStore((state) => state.fetchSubmissions);

  React.useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions, page, filters]);

  const totalPages = Math.max(1, Math.ceil(total / SUBMISSIONS_PAGE_SIZE));

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="History"
          title="Submissions"
          description="Every solution you've submitted, across every problem."
        />

        <div className="grid gap-3 sm:grid-cols-2 sm:max-w-md">
          <Select
            value={filters.status ?? ''}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              setFilters({ ...filters, status: (value || undefined) as SubmissionStatusValue })
            }
          />
          <Select
            value={filters.language ?? ''}
            options={LANGUAGE_OPTIONS}
            onChange={(value) =>
              setFilters({ ...filters, language: (value || undefined) as AssessmentLanguage })
            }
          />
        </div>

        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-(--color-text-muted)">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading submissions…
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center text-sm text-(--color-text-muted)">
            {hasLoaded ? 'No submissions match your filters.' : 'Loading…'}
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {items.map((submission) => (
              <li key={submission.id}>
                <SubmissionRow submission={submission} />
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              className="rounded-md border border-(--color-border-subtle) px-3 py-1.5 text-(--color-text-primary) transition-colors hover:border-(--color-accent) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-(--color-text-muted)">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              className="rounded-md border border-(--color-border-subtle) px-3 py-1.5 text-(--color-text-primary) transition-colors hover:border-(--color-accent) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
