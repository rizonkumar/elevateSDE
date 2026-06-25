'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@elevatesde/ui';
import {
  Play,
  Send,
  FileCode2,
  Code2,
  Terminal,
  ArrowLeft,
  Settings,
  FlaskConical,
} from 'lucide-react';
import { useAssessmentStore } from '@/store/assessment.store';
import { ProblemPanel } from './_components/ProblemPanel';
import { EditorPanel } from './_components/EditorPanel';
import { ConsolePanel } from './_components/ConsolePanel';
import { TimerControl } from './_components/TimerControl';
import { SettingsModal } from './_components/SettingsModal';
import { StreakCelebrationModal } from '@/components/dashboard/daily/StreakCelebrationModal';
import { useMediaQuery } from './_components/useMediaQuery';

type MobileView = 'problem' | 'code' | 'output';

const MOBILE_VIEWS: { id: MobileView; label: string; icon: typeof FileCode2 }[] = [
  { id: 'problem', label: 'Problem', icon: FileCode2 },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'output', label: 'Output', icon: Terminal },
];

function HorizontalHandle() {
  return (
    <PanelResizeHandle className="group flex w-3 items-center justify-center">
      <div className="h-10 w-1 rounded-full bg-(--color-border-subtle) transition-colors group-hover:bg-(--color-accent) group-data-[resize-handle-state=drag]:bg-(--color-accent)" />
    </PanelResizeHandle>
  );
}

function VerticalHandle() {
  return (
    <PanelResizeHandle className="group flex h-3 items-center justify-center">
      <div className="h-1 w-10 rounded-full bg-(--color-border-subtle) transition-colors group-hover:bg-(--color-accent) group-data-[resize-handle-state=drag]:bg-(--color-accent)" />
    </PanelResizeHandle>
  );
}

export default function AssessmentPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const status = useAssessmentStore((state) => state.status);
  const problem = useAssessmentStore((state) => state.problem);
  const isRunning = useAssessmentStore((state) => state.isRunning);
  const isSubmitting = useAssessmentStore((state) => state.isSubmitting);
  const editorMaximized = useAssessmentStore((state) => state.editorMaximized);
  const loadProblem = useAssessmentStore((state) => state.loadProblem);
  const reset = useAssessmentStore((state) => state.reset);
  const run = useAssessmentStore((state) => state.run);
  const submit = useAssessmentStore((state) => state.submit);
  const celebration = useAssessmentStore((state) => state.celebration);
  const dismissCelebration = useAssessmentStore((state) => state.dismissCelebration);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [mobileView, setMobileView] = React.useState<MobileView>('problem');
  const [settingsOpen, setSettingsOpen] = React.useState(false);

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
        <h1 className="m-0 font-display text-2xl font-semibold tracking-tight">
          Problem not found
        </h1>
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
  const comingSoon = problem.testCases.length === 0;

  const desktopLayout = editorMaximized ? (
    <div className="min-h-0 flex-1 p-3">
      <EditorPanel />
    </div>
  ) : (
    <div className="min-h-0 flex-1 p-3">
      <PanelGroup direction="horizontal" autoSaveId="assessment-layout-h-v1" className="h-full">
        <Panel defaultSize={42} minSize={24} className="min-h-0">
          <ProblemPanel problem={problem} />
        </Panel>
        <HorizontalHandle />
        <Panel minSize={30} className="min-h-0">
          <PanelGroup direction="vertical" autoSaveId="assessment-layout-v-v1" className="h-full">
            <Panel defaultSize={62} minSize={20} className="min-h-0">
              <EditorPanel />
            </Panel>
            <VerticalHandle />
            <Panel defaultSize={38} minSize={15} className="min-h-0">
              <ConsolePanel />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );

  const mobileLayout = (
    <>
      <div className="flex items-center gap-1 border-b border-(--color-border-subtle) px-4 py-2">
        {MOBILE_VIEWS.map((view) => {
          const Icon = view.icon;
          const active = mobileView === view.id;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => setMobileView(view.id)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
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
      <div className="min-h-0 flex-1 p-3">
        <div className={`${mobileView === 'problem' ? 'block' : 'hidden'} h-full`}>
          <ProblemPanel problem={problem} />
        </div>
        <div className={`${mobileView === 'code' ? 'block' : 'hidden'} h-full`}>
          <EditorPanel />
        </div>
        <div className={`${mobileView === 'output' ? 'block' : 'hidden'} h-full`}>
          <ConsolePanel />
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex h-[100dvh] flex-col"
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
            <h1 className="m-0 truncate font-display text-lg font-semibold tracking-tight">
              {problem.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {comingSoon && (
            <span className="hidden items-center gap-1.5 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) px-3 py-1.5 text-xs font-medium text-(--color-text-muted) sm:inline-flex">
              <FlaskConical className="h-3.5 w-3.5" />
              Test cases coming soon
            </span>
          )}
          <TimerControl />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border-subtle) text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
          >
            <Settings className="h-4 w-4" />
          </button>
          <Button
            variant="secondary"
            onClick={() => {
              run();
            }}
            disabled={busy || comingSoon}
            className="inline-flex items-center gap-2 px-4!"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running…' : 'Run'}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              submit();
            }}
            disabled={busy || comingSoon}
            className="inline-flex items-center gap-2 px-4!"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </header>

      {isDesktop ? desktopLayout : mobileLayout}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <StreakCelebrationModal
        open={celebration !== null}
        streak={celebration?.streak ?? 0}
        onClose={dismissCelebration}
      />
    </motion.div>
  );
}
