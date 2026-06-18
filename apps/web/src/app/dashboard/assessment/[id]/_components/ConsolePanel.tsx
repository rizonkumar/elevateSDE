'use client';

import { Tabs } from '@elevatesde/ui';
import { CheckCircle2, XCircle, AlertTriangle, Terminal, Loader2, Cpu, Timer } from 'lucide-react';
import type {
  AssessmentRunStatus,
  TestCaseResultDto,
  TestCaseResultStatus,
} from '@elevatesde/shared-types';
import { useAssessmentStore } from '@/store/assessment.store';

const STATUS_HEADLINE: Record<AssessmentRunStatus, string> = {
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  RUNTIME_ERROR: 'Runtime Error',
};

function statusTone(status: AssessmentRunStatus): string {
  if (status === 'ACCEPTED') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300';
  }
  return 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300';
}

function CaseIcon({ status }: { status: TestCaseResultStatus }) {
  if (status === 'PASS') return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />;
  if (status === 'FAIL') return <XCircle className="h-4 w-4 shrink-0 text-rose-500" />;
  return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />;
}

function ResultRow({ result }: { result: TestCaseResultDto }) {
  return (
    <div className="rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-bg-soft) p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
          <CaseIcon status={result.status} />
          {result.label}
          {result.isHidden && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-(--color-text-muted)">
              hidden
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-(--color-text-muted)">
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            {result.runtimeMs} ms
          </span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5" />
            {(result.memoryKb / 1024).toFixed(1)} MB
          </span>
        </div>
      </div>
      {!result.isHidden && (
        <dl className="mt-2.5 grid gap-1.5 font-mono text-xs text-(--color-text-primary) sm:grid-cols-3">
          <div>
            <dt className="text-(--color-text-muted)">Input</dt>
            <dd className="m-0 break-all">{result.input}</dd>
          </div>
          <div>
            <dt className="text-(--color-text-muted)">Expected</dt>
            <dd className="m-0 break-all">{result.expectedOutput}</dd>
          </div>
          <div>
            <dt className="text-(--color-text-muted)">Output</dt>
            <dd
              className={`m-0 break-all ${result.status === 'PASS' ? '' : 'text-rose-500'}`}
            >
              {result.actualOutput || '—'}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export function ConsolePanel() {
  const isRunning = useAssessmentStore((state) => state.isRunning);
  const isSubmitting = useAssessmentStore((state) => state.isSubmitting);
  const result = useAssessmentStore((state) => state.lastResult);
  const consoleTab = useAssessmentStore((state) => state.consoleTab);
  const setConsoleTab = useAssessmentStore((state) => state.setConsoleTab);

  const busy = isRunning || isSubmitting;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-soft)">
      <div className="flex items-center justify-between gap-3 border-b border-(--color-border-subtle) px-4 py-2.5">
        <Tabs
          value={consoleTab}
          onChange={(id) => setConsoleTab(id === 'console' ? 'console' : 'results')}
          items={[
            { id: 'results', label: 'Test Results', icon: CheckCircle2 },
            { id: 'console', label: 'Console', icon: Terminal },
          ]}
        />
        {result && !busy && (
          <span className="text-xs font-medium text-(--color-text-muted)">
            {result.passedCount}/{result.totalCount} passed · {result.totalRuntimeMs} ms ·{' '}
            {(result.peakMemoryKb / 1024).toFixed(1)} MB
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {busy ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-(--color-text-muted)">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isSubmitting ? 'Submitting solution…' : 'Running test cases…'}
          </div>
        ) : !result ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center text-sm text-(--color-text-muted)">
            <Terminal className="h-5 w-5" />
            <p className="m-0">Run your code to see test results and output.</p>
          </div>
        ) : consoleTab === 'console' ? (
          <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-(--color-text-primary)">
            {result.stdout}
          </pre>
        ) : (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 rounded-(--radius-lg) border px-3.5 py-2.5 text-sm font-semibold ${statusTone(result.status)}`}
            >
              {result.status === 'ACCEPTED' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {STATUS_HEADLINE[result.status]}
            </div>
            {result.results.map((caseResult) => (
              <ResultRow key={caseResult.testCaseId} result={caseResult} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
