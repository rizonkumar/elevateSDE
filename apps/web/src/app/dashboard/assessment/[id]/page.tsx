'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@elevatesde/ui';
import { Play, Send, FileCode2, Code2, Terminal, ArrowLeft } from 'lucide-react';
import { useAssessmentStore } from '@/store/assessment.store';
import { ProblemPanel } from './_components/ProblemPanel';
import { EditorPanel } from './_components/EditorPanel';
import { ConsolePanel } from './_components/ConsolePanel';
import { SessionTimer } from './_components/SessionTimer';

type MobileView = 'problem' | 'code' | 'output';

const MOBILE_VIEWS: { id: MobileView; label: string; icon: typeof FileCode2 }[] = [
  { id: 'problem', label: 'Problem', icon: FileCode2 },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'output', label: 'Output', icon: Terminal },
];

export default function AssessmentPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const status = useAssessmentStore((state) => state.status);
  const problem = useAssessmentStore((state) => state.problem);
  const isRunning = useAssessmentStore((state) => state.isRunning);
  const isSubmitting = useAssessmentStore((state) => state.isSubmitting);
  const remainingSeconds = useAssessmentStore((state) => state.remainingSeconds);
  const loadProblem = useAssessmentStore((state) => state.loadProblem);
  const reset = useAssessmentStore((state) => state.reset);
  const run = useAssessmentStore((state) => state.run);
  const submit = useAssessmentStore((state) => state.submit);

  const [mobileView, setMobileView] = React.useState<MobileView>('problem');

  React.useEffect(() => {
    if (id) {
      loadProblem(id);
    }
    return () => reset();
  }, [id, loadProblem, reset]);

  if (status === 'NOT_FOUND') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
        <FileCode2 className="mb-4 h-8 w-8 text-(--color-text-muted)" />
        <h1 className="m-0 font-display text-2xl font-bold tracking-tight">Problem not found</h1>
        <p className="mt-2 text-sm text-(--color-text-muted)">
          We couldn&apos;t find an assessment with that id.
        </p>
        <Link
          href="/dashboard/assessment"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-(--color-accent)"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to problems
        </Link>
      </div>
    );
  }

  if (status === 'LOADING' || !problem) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-(--color-text-muted)">
        Loading…
      </div>
    );
  }

  const busy = isRunning || isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex h-[calc(100dvh-4rem)] flex-col"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border-subtle) px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard/assessment"
            aria-label="Back to problems"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--color-border-subtle) text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-accent)">
              Coding assessment
            </div>
            <h1 className="m-0 truncate font-display text-lg font-bold tracking-tight">
              {problem.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <SessionTimer remainingSeconds={remainingSeconds} />
          <Button
            variant="secondary"
            onClick={() => void run()}
            disabled={busy}
            className="inline-flex items-center gap-2 !px-4"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running…' : 'Run'}
          </Button>
          <Button
            variant="primary"
            onClick={() => void submit()}
            disabled={busy}
            className="inline-flex items-center gap-2 !px-4"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-1 border-b border-(--color-border-subtle) px-4 py-2 lg:hidden">
        {MOBILE_VIEWS.map((view) => {
          const Icon = view.icon;
          const active = mobileView === view.id;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => setMobileView(view.id)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-(--radius-lg) px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-(--color-badge-bg) text-(--color-text-primary)'
                  : 'text-(--color-text-muted)'
              }`}
            >
              <Icon className="h-4 w-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-2">
        <div className={`${mobileView === 'problem' ? 'flex' : 'hidden'} min-h-0 lg:flex`}>
          <div className="min-h-0 w-full">
            <ProblemPanel problem={problem} />
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div className={`${mobileView === 'code' ? 'flex' : 'hidden'} min-h-0 flex-1 lg:flex`}>
            <div className="min-h-0 w-full">
              <EditorPanel />
            </div>
          </div>
          <div
            className={`${mobileView === 'output' ? 'flex' : 'hidden'} min-h-0 flex-1 lg:flex lg:h-2/5 lg:flex-none`}
          >
            <div className="min-h-0 w-full">
              <ConsolePanel />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
