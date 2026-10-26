'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';
import { isMockInterviewTopic } from '@/lib/mock-interview-options';
import { useMockInterviewStore } from '@/store/mock-interview.store';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { InterviewSetup } from './InterviewSetup';
import { InterviewConsole } from './InterviewConsole';
import { FeedbackReport } from './FeedbackReport';
import { SessionStatusPanel } from './SessionStatusPanel';

interface MockInterviewWorkspaceProps {
  readonly preparationTaskId: string | null;
  readonly initialTopic: string | null;
}

export function MockInterviewWorkspace({ preparationTaskId, initialTopic }: MockInterviewWorkspaceProps) {
  const status = useMockInterviewStore((state) => state.status);
  const session = useMockInterviewStore((state) => state.session);
  const isHydrated = useMockInterviewStore((state) => state.isHydrated);
  const hydrate = useMockInterviewStore((state) => state.hydrate);
  const reset = useMockInterviewStore((state) => state.reset);

  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);

  function renderContent(): React.ReactNode {
    if (status === 'ACTIVE') return <InterviewConsole />;
    if (status === 'COMPLETED' && session?.feedback) {
      return <FeedbackReport session={session} feedback={session.feedback} onReset={reset} />;
    }
    if (session && (status === 'SCORING' || status === 'FAILED' || status === 'ABANDONED')) {
      return <SessionStatusPanel session={session} onReset={reset} />;
    }
    return (
      <InterviewSetup
        preparationTaskId={preparationTaskId}
        initialTopic={isMockInterviewTopic(initialTopic) ? initialTopic : null}
      />
    );
  }

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-8"
      >
        <PageHeader
          kicker="Mock interview"
          title="AI Interview Console"
          description="Practice realistic technical and behavioral rounds with an AI interviewer, then review a scored breakdown of every answer."
          actions={
            <Link
              href="/dashboard/mock-interview/history"
              className="inline-flex h-10 items-center gap-2 rounded-(--radius-sm) border border-(--color-border-subtle) px-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
            >
              <History className="h-4 w-4" />
              Past interviews
            </Link>
          }
        />
      </motion.div>

      {isHydrated ? (
        renderContent()
      ) : (
        <div className="flex items-center justify-center py-24 text-sm text-(--color-text-muted)">
          Loading…
        </div>
      )}
    </PageContainer>
  );
}
