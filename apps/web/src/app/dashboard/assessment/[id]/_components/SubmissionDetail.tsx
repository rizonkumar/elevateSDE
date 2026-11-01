'use client';

import * as React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { PerformanceDistributionDto, SubmissionDetailDto } from '@elevatesde/shared-types';
import { getPerformanceDistribution, getSubmission } from '@/lib/assessments-api';
import { formatRelativeTime } from '@/lib/relative-time';
import { PerformanceHistogram } from './PerformanceHistogram';
import { SegmentedControl } from './SegmentedControl';
import { CodeReviewPanel } from './CodeReviewPanel';
import { NumberedCode, codeLineId } from './NumberedCode';
import {
  LANGUAGE_LABEL,
  SUBMISSION_STATUS_LABEL,
  formatMemory,
  formatRuntime,
  statusTextClass,
} from './submission-format';

type Metric = 'runtime' | 'memory';

const METRIC_OPTIONS: readonly { value: Metric; label: string }[] = [
  { value: 'runtime', label: 'Runtime' },
  { value: 'memory', label: 'Memory' },
];

interface SubmissionDetailProps {
  submissionId: string;
  onBack: () => void;
}

function MetricTile({
  label,
  value,
  percentile,
  comparison,
}: Readonly<{ label: string; value: string; percentile: number | null; comparison: string }>) {
  return (
    <div className="rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) p-3.5">
      <div className="text-xs font-medium text-(--color-text-muted)">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tracking-tight text-(--color-text-primary)">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-(--color-text-muted)">
        {percentile === null ? 'Not enough data to compare' : `${comparison} ${percentile}%`}
      </div>
    </div>
  );
}

export function SubmissionDetail({ submissionId, onBack }: Readonly<SubmissionDetailProps>) {
  const [detail, setDetail] = React.useState<SubmissionDetailDto | null>(null);
  const [distribution, setDistribution] = React.useState<PerformanceDistributionDto | null>(null);
  const [metric, setMetric] = React.useState<Metric>('runtime');
  const [failed, setFailed] = React.useState(false);
  const [findingLines, setFindingLines] = React.useState<ReadonlySet<number>>(new Set());
  const [focusedLine, setFocusedLine] = React.useState<number | null>(null);

  const handleFindingsChange = React.useCallback((lines: number[]) => {
    setFindingLines(new Set(lines));
  }, []);

  const jumpToLine = React.useCallback(
    (line: number) => {
      setFocusedLine(line);
      document
        .getElementById(codeLineId(`submission-${submissionId}`, line))
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [submissionId],
  );

  React.useEffect(() => {
    let active = true;
    setDetail(null);
    setDistribution(null);
    setFailed(false);
    getSubmission(submissionId)
      .then(async (submission) => {
        if (!active) return;
        setDetail(submission);
        if (submission.status === 'ACCEPTED') {
          const data = await getPerformanceDistribution(submission.problemId, submission.language);
          if (active) setDistribution(data);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [submissionId]);

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
    >
      <ArrowLeft className="h-4 w-4" />
      All submissions
    </button>
  );

  if (failed) {
    return (
      <div className="flex flex-col gap-4">
        {backButton}
        <p className="m-0 text-sm text-(--color-danger)">Could not load this submission.</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col gap-4">
        {backButton}
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-(--color-text-muted)" />
        </div>
      </div>
    );
  }

  const accepted = detail.status === 'ACCEPTED';
  const reviewable =
    detail.status === 'ACCEPTED' ||
    detail.status === 'WRONG_ANSWER' ||
    detail.status === 'TIME_LIMIT_EXCEEDED' ||
    detail.status === 'RUNTIME_ERROR';
  const buckets = distribution ? distribution[metric] : [];

  return (
    <div className="flex flex-col gap-5">
      {backButton}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={`m-0 text-lg font-semibold ${statusTextClass(detail.status)}`}>
          {SUBMISSION_STATUS_LABEL[detail.status]}
        </h3>
        <span className="text-xs text-(--color-text-muted)">
          {LANGUAGE_LABEL[detail.language]} · {formatRelativeTime(detail.createdAt)} ·{' '}
          {detail.passedCount}/{detail.totalCount} cases passed
        </span>
      </div>

      {accepted && (
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricTile
            label="Runtime"
            value={formatRuntime(detail.totalRuntimeMs)}
            percentile={detail.runtimePercentile}
            comparison="Faster than"
          />
          <MetricTile
            label="Memory"
            value={formatMemory(detail.peakMemoryKb)}
            percentile={detail.memoryPercentile}
            comparison="Less memory than"
          />
        </div>
      )}

      {accepted && distribution && distribution.sampleSize > 1 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="m-0 text-sm font-semibold text-(--color-text-primary)">
                {metric === 'runtime' ? 'Runtime' : 'Memory'} distribution
              </h4>
              <p className="m-0 text-xs text-(--color-text-muted)">
                Best accepted {LANGUAGE_LABEL[detail.language]} run of {distribution.sampleSize}{' '}
                users. Runtimes vary between runs, so treat this as approximate.
              </p>
            </div>
            <SegmentedControl
              value={metric}
              options={METRIC_OPTIONS}
              onChange={setMetric}
              ariaLabel="Distribution metric"
            />
          </div>
          <PerformanceHistogram
            buckets={buckets}
            ownValue={
              metric === 'runtime' ? Math.round(detail.totalRuntimeMs) : detail.peakMemoryKb
            }
            format={metric === 'runtime' ? formatRuntime : formatMemory}
            metricLabel={metric === 'runtime' ? 'Runtime' : 'Memory'}
          />
        </section>
      )}

      <CodeReviewPanel
        submissionId={detail.id}
        reviewable={reviewable}
        onFindingsChange={handleFindingsChange}
        onJumpToLine={jumpToLine}
      />

      <section className="flex flex-col gap-2">
        <h4 className="m-0 text-sm font-semibold text-(--color-text-primary)">Code</h4>
        <NumberedCode
          code={detail.sourceCode}
          highlightedLines={findingLines}
          focusedLine={focusedLine}
          idPrefix={`submission-${detail.id}`}
        />
      </section>
    </div>
  );
}
