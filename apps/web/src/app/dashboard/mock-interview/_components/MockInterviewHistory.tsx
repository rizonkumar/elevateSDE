'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Badge, Button } from '@elevatesde/ui';
import type { BadgeVariant } from '@elevatesde/ui';
import type { MockInterviewSessionStatus, MockInterviewSummaryDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { listMockInterviews, mockInterviewErrorMessage } from '@/lib/mock-interview-api';
import {
  ROLE_LABELS,
  SESSION_STATUS_LABELS,
  STYLE_LABELS,
  TOPIC_LABELS,
} from '@/lib/mock-interview-options';
import { SEVERITY_VARIANT, severityFor } from '@/lib/mock-interview-severity';

const STATUS_VARIANT: Record<MockInterviewSessionStatus, BadgeVariant> = {
  ACTIVE: 'accent',
  SCORING: 'accent',
  COMPLETED: 'success',
  FAILED: 'danger',
  ABANDONED: 'neutral',
};

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function HistoryRow({ item }: { readonly item: MockInterviewSummaryDto }) {
  const href =
    item.status === 'ACTIVE' ? '/dashboard/mock-interview' : `/dashboard/mock-interview/${item.id}`;
  return (
    <li className="list-none">
      <Link
        href={href}
        className="flex items-center gap-4 rounded-(--radius-md) px-3 py-3.5 transition-colors hover:bg-(--color-badge-bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) sm:px-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-(--color-text-primary)">
              {TOPIC_LABELS[item.config.topic]}
            </span>
            <Badge variant={STATUS_VARIANT[item.status]}>{SESSION_STATUS_LABELS[item.status]}</Badge>
          </div>
          <p className="m-0 mt-1 truncate text-xs text-(--color-text-muted)">
            {ROLE_LABELS[item.config.roleLevel]} · {STYLE_LABELS[item.config.companyStyle]} ·{' '}
            {item.answeredCount} answered · {DATE_FORMAT.format(new Date(item.startedAt))}
          </p>
        </div>
        {item.overallScore !== null && (
          <Badge variant={SEVERITY_VARIANT[severityFor(item.overallScore)]}>{item.overallScore}</Badge>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-(--color-text-muted)" />
      </Link>
    </li>
  );
}

export function MockInterviewHistory() {
  const [items, setItems] = React.useState<MockInterviewSummaryDto[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (next: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await listMockInterviews(next);
      setItems((current) => (next ? [...current, ...page.items] : page.items));
      setCursor(page.nextCursor);
    } catch (loadError) {
      setError(mockInterviewErrorMessage(loadError, 'Could not load your past interviews.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(null);
  }, [load]);

  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader
          kicker="Mock interview"
          title="Past interviews"
          description="Revisit your scored rounds and track how your answers improve over time."
          actions={
            <Link
              href="/dashboard/mock-interview"
              className="inline-flex h-10 items-center gap-2 rounded-(--radius-sm) border border-(--color-border-subtle) px-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to console
            </Link>
          }
        />
      </div>

      <div className="card flex flex-col gap-2 p-2 sm:p-3">
        {items.length > 0 && (
          <ul className="m-0 flex flex-col p-0">
            {items.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </ul>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
            <p className="m-0 text-sm font-medium text-(--color-text-primary)">No interviews yet</p>
            <p className="m-0 text-sm text-(--color-text-muted)">
              Finish a mock interview and its report will appear here.
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className="m-0 px-4 py-6 text-center text-sm text-(--color-danger)">
            {error}
          </p>
        )}
        {isLoading && (
          <p className="m-0 px-4 py-6 text-center text-sm text-(--color-text-muted)">Loading…</p>
        )}
        {!isLoading && cursor && (
          <Button variant="secondary" className="self-center" onClick={() => void load(cursor)}>
            Load more
          </Button>
        )}
      </div>
    </PageContainer>
  );
}
