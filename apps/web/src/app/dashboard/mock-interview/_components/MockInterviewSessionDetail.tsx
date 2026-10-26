'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { MockInterviewSessionDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { getMockInterview, mockInterviewErrorMessage } from '@/lib/mock-interview-api';
import { TOPIC_LABELS } from '@/lib/mock-interview-options';
import { FeedbackReport } from './FeedbackReport';
import { SessionStatusPanel } from './SessionStatusPanel';

const POLL_MS = 2000;
const POLL_LIMIT = 45;

interface MockInterviewSessionDetailProps {
  readonly sessionId: string;
}

export function MockInterviewSessionDetail({ sessionId }: MockInterviewSessionDetailProps) {
  const [session, setSession] = React.useState<MockInterviewSessionDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchSession = async (attempt: number) => {
      try {
        const latest = await getMockInterview(sessionId);
        if (cancelled) return;
        setSession(latest);
        if (latest.status === 'SCORING' && attempt + 1 < POLL_LIMIT) {
          timer = setTimeout(() => void fetchSession(attempt + 1), POLL_MS);
        }
      } catch (loadError) {
        if (!cancelled) setError(mockInterviewErrorMessage(loadError, 'Could not load this interview.'));
      }
    };

    void fetchSession(0);
    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, [sessionId]);

  function renderContent(): React.ReactNode {
    if (error) {
      return (
        <p role="alert" className="card m-0 py-10 text-center text-sm text-(--color-danger)">
          {error}
        </p>
      );
    }
    if (!session) {
      return <div className="py-24 text-center text-sm text-(--color-text-muted)">Loading…</div>;
    }
    if (session.status === 'COMPLETED' && session.feedback) {
      return <FeedbackReport session={session} feedback={session.feedback} />;
    }
    if (session.status === 'ACTIVE') {
      return (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <p className="m-0 text-sm text-(--color-text-primary)">This interview is still in progress.</p>
          <Link href="/dashboard/mock-interview" className="text-sm font-medium text-(--color-accent)">
            Resume interview
          </Link>
        </div>
      );
    }
    return <SessionStatusPanel session={session} />;
  }

  return (
    <PageContainer>
      <div className="mb-8">
        <PageHeader
          kicker="Mock interview report"
          title={session ? `${TOPIC_LABELS[session.config.topic]} interview` : 'Interview report'}
          actions={
            <Link
              href="/dashboard/mock-interview/history"
              className="inline-flex h-10 items-center gap-2 rounded-(--radius-sm) border border-(--color-border-subtle) px-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
            >
              <ArrowLeft className="h-4 w-4" />
              All interviews
            </Link>
          }
        />
      </div>
      {renderContent()}
    </PageContainer>
  );
}
