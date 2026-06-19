'use client';

import * as React from 'react';
import { Tabs, Textarea } from '@elevatesde/ui';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Cpu,
  Timer,
  FlaskConical,
  ListChecks,
} from 'lucide-react';
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

const DETAIL_FIELDS = ['Input', 'Expected', 'Output'] as const;

type DetailField = (typeof DETAIL_FIELDS)[number];

function statusTone(status: AssessmentRunStatus): string {
  if (status === 'ACCEPTED') {
    return 'border-(--color-success) bg-(--color-success-soft) text-(--color-success)';
  }
  return 'border-(--color-danger) bg-(--color-danger-soft) text-(--color-danger)';
}

function caseDotClass(status: TestCaseResultStatus): string {
  if (status === 'PASS') return 'bg-(--color-success)';
  if (status === 'FAIL') return 'bg-(--color-danger)';
  return 'bg-(--color-warning)';
}

function fieldValue(field: DetailField, result: TestCaseResultDto): string {
  if (field === 'Input') return result.input;
  if (field === 'Expected') return result.expectedOutput;
  return result.actualOutput || '—';
}

function StatusIcon({ status }: Readonly<{ status: TestCaseResultStatus }>) {
  if (status === 'PASS') return <CheckCircle2 className="h-4 w-4 shrink-0 text-(--color-success)" />;
  if (status === 'FAIL') return <XCircle className="h-4 w-4 shrink-0 text-(--color-danger)" />;
  return <AlertTriangle className="h-4 w-4 shrink-0 text-(--color-warning)" />;
}

function CaseSubTabs({
  count,
  activeIndex,
  onSelect,
  statuses,
}: Readonly<{
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  statuses?: (TestCaseResultStatus | undefined)[];
}>) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: count }, (_, index) => {
        const active = index === activeIndex;
        const status = statuses?.[index];
        return (
          <button
            key={`case-tab-${index + 1}`}
            type="button"
            onClick={() => onSelect(index)}
            className={`inline-flex items-center gap-1.5 rounded-(--radius-sm) px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              active
                ? 'bg-(--color-badge-bg) text-(--color-text-primary)'
                : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
            }`}
          >
            {status && <span className={`h-1.5 w-1.5 rounded-full ${caseDotClass(status)}`} />}
            Case {index + 1}
          </button>
        );
      })}
    </div>
  );
}

function CaseDetail({ result }: Readonly<{ result: TestCaseResultDto }>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)">
        <StatusIcon status={result.status} />
        {result.label}
        <span className="ml-auto flex items-center gap-3 text-xs font-normal text-(--color-text-muted)">
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            {result.runtimeMs} ms
          </span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5" />
            {(result.memoryKb / 1024).toFixed(1)} MB
          </span>
        </span>
      </div>
      {DETAIL_FIELDS.map((field) => {
        const wrong = field === 'Output' && result.status !== 'PASS';
        return (
          <div key={field}>
            <div className="mb-1 text-xs text-(--color-text-muted)">{field}</div>
            <div
              className={`rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) px-3 py-2 font-mono text-xs break-all ${
                wrong ? 'text-(--color-danger)' : 'text-(--color-text-primary)'
              }`}
            >
              {fieldValue(field, result)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ConsolePanel() {
  const isRunning = useAssessmentStore((state) => state.isRunning);
  const isSubmitting = useAssessmentStore((state) => state.isSubmitting);
  const result = useAssessmentStore((state) => state.lastResult);
  const testcaseTab = useAssessmentStore((state) => state.testcaseTab);
  const setTestcaseTab = useAssessmentStore((state) => state.setTestcaseTab);
  const activeCaseIndex = useAssessmentStore((state) => state.activeCaseIndex);
  const setActiveCaseIndex = useAssessmentStore((state) => state.setActiveCaseIndex);
  const caseInputs = useAssessmentStore((state) => state.caseInputs);
  const setCaseInput = useAssessmentStore((state) => state.setCaseInput);

  const busy = isRunning || isSubmitting;
  const visibleResults = result?.results.filter((item) => !item.isHidden) ?? [];
  const hiddenResults = result?.results.filter((item) => item.isHidden) ?? [];
  const safeIndex = Math.min(activeCaseIndex, Math.max(0, caseInputs.length - 1));
  const activeInput = caseInputs[safeIndex] ?? '';
  const activeResult = visibleResults[safeIndex];

  const renderBody = (): React.ReactNode => {
    if (testcaseTab === 'testcase') {
      return (
        <div className="space-y-4">
          <CaseSubTabs
            count={caseInputs.length}
            activeIndex={safeIndex}
            onSelect={setActiveCaseIndex}
          />
          <div>
            <div className="mb-1.5 text-xs text-(--color-text-muted)">Input</div>
            <Textarea
              value={activeInput}
              onChange={(event) => setCaseInput(safeIndex, event.target.value)}
              className="font-mono text-xs"
              spellCheck={false}
            />
          </div>
        </div>
      );
    }

    if (busy) {
      return (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-(--color-text-muted)">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isSubmitting ? 'Submitting solution…' : 'Running test cases…'}
        </div>
      );
    }

    if (result) {
      return (
        <div className="space-y-4">
          <div
            className={`flex items-center gap-2 rounded-(--radius-sm) border px-3.5 py-2.5 text-sm font-semibold ${statusTone(result.status)}`}
          >
            {result.status === 'ACCEPTED' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {STATUS_HEADLINE[result.status]}
          </div>
          <CaseSubTabs
            count={visibleResults.length}
            activeIndex={safeIndex}
            onSelect={setActiveCaseIndex}
            statuses={visibleResults.map((item) => item.status)}
          />
          {activeResult && <CaseDetail result={activeResult} />}
          {hiddenResults.length > 0 && (
            <div className="rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) px-3.5 py-2.5 text-xs text-(--color-text-muted)">
              {hiddenResults.filter((item) => item.status === 'PASS').length}/{hiddenResults.length}{' '}
              hidden test cases passed.
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center text-sm text-(--color-text-muted)">
        <ListChecks className="h-5 w-5" />
        <p className="m-0">Run your code to see test results.</p>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card)">
      <div className="flex items-center justify-between gap-3 border-b border-(--color-border-subtle) px-4 py-2.5">
        <Tabs
          value={testcaseTab}
          onChange={(id) => setTestcaseTab(id === 'result' ? 'result' : 'testcase')}
          items={[
            { id: 'testcase', label: 'Testcase', icon: FlaskConical },
            { id: 'result', label: 'Test Result', icon: ListChecks },
          ]}
        />
        {result && !busy && (
          <span className="hidden text-xs font-medium text-(--color-text-muted) sm:inline">
            {result.passedCount}/{result.totalCount} passed · {result.totalRuntimeMs} ms ·{' '}
            {(result.peakMemoryKb / 1024).toFixed(1)} MB
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{renderBody()}</div>
    </div>
  );
}
