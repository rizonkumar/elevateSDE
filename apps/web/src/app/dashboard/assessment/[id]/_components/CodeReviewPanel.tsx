'use client';

import * as React from 'react';
import axios from 'axios';
import { AlertTriangle, Info, Lightbulb, Loader2, ScanSearch, Sparkles } from 'lucide-react';
import { Badge, Button } from '@elevatesde/ui';
import type {
  CodeReviewFindingCategory,
  CodeReviewFindingDto,
  CodeReviewFindingSeverity,
  CodeReviewQuotaDto,
  SubmissionReviewDto,
} from '@elevatesde/shared-types';
import { getCodeReview, getCodeReviewQuota, requestCodeReview } from '@/lib/assessments-api';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 45;

const CATEGORY_LABEL: Record<CodeReviewFindingCategory, string> = {
  CORRECTNESS: 'Correctness',
  EDGE_CASE: 'Edge cases',
  PERFORMANCE: 'Performance',
  COMPLEXITY: 'Complexity',
  READABILITY: 'Readability',
};

const CATEGORY_ORDER: CodeReviewFindingCategory[] = [
  'CORRECTNESS',
  'EDGE_CASE',
  'PERFORMANCE',
  'COMPLEXITY',
  'READABILITY',
];

const SEVERITY_META: Record<
  CodeReviewFindingSeverity,
  { icon: typeof Info; label: string; tone: string }
> = {
  ISSUE: { icon: AlertTriangle, label: 'Issue', tone: 'text-(--color-danger)' },
  SUGGESTION: { icon: Lightbulb, label: 'Suggestion', tone: 'text-(--color-warning)' },
  INFO: { icon: Info, label: 'Note', tone: 'text-(--color-text-muted)' },
};

interface CodeReviewPanelProps {
  submissionId: string;
  reviewable: boolean;
  onFindingsChange: (lines: number[]) => void;
  onJumpToLine: (line: number) => void;
}

function messageFor(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.message;
    if (typeof message === 'string') return message;
  }
  return 'Could not request a code review. Please try again.';
}

function FindingItem({
  finding,
  onJumpToLine,
}: Readonly<{ finding: CodeReviewFindingDto; onJumpToLine: (line: number) => void }>) {
  const meta = SEVERITY_META[finding.severity];
  const Icon = meta.icon;
  return (
    <li className="flex gap-2.5 py-2.5">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.tone}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="m-0 text-(--color-text-primary)">
          <span className="sr-only">{meta.label}: </span>
          {finding.message}
        </p>
        {finding.suggestion && (
          <p className="mt-1 mb-0 text-xs text-(--color-text-muted)">{finding.suggestion}</p>
        )}
        {finding.line !== null && (
          <button
            type="button"
            onClick={() => finding.line !== null && onJumpToLine(finding.line)}
            className="mt-1 cursor-pointer text-xs font-semibold text-(--color-accent) hover:underline"
          >
            Line {finding.line}
          </button>
        )}
      </div>
    </li>
  );
}

function ReviewBody({
  review,
  onJumpToLine,
}: Readonly<{ review: SubmissionReviewDto; onJumpToLine: (line: number) => void }>) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    findings: review.findings.filter((finding) => finding.category === category),
  })).filter((group) => group.findings.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {review.timeComplexity && <Badge variant="neutral">Time {review.timeComplexity}</Badge>}
        {review.spaceComplexity && <Badge variant="neutral">Space {review.spaceComplexity}</Badge>}
        <span className="inline-flex items-center gap-1 text-xs text-(--color-text-muted)">
          {review.engine === 'LLM' ? (
            <>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI review
            </>
          ) : (
            'Automated review'
          )}
        </span>
      </div>
      {review.summary && (
        <p className="m-0 text-sm leading-relaxed text-(--color-text-primary)/85">
          {review.summary}
        </p>
      )}
      {grouped.length === 0 ? (
        <p className="m-0 text-sm text-(--color-text-muted)">No findings. Nicely done.</p>
      ) : (
        grouped.map((group) => (
          <section key={group.category}>
            <h5 className="m-0 text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
              {CATEGORY_LABEL[group.category]}
            </h5>
            <ul className="m-0 list-none divide-y divide-(--color-border-subtle) p-0">
              {group.findings.map((finding) => (
                <FindingItem
                  key={`${finding.category}-${finding.line ?? 'x'}-${finding.message}`}
                  finding={finding}
                  onJumpToLine={onJumpToLine}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

export function CodeReviewPanel({
  submissionId,
  reviewable,
  onFindingsChange,
  onJumpToLine,
}: Readonly<CodeReviewPanelProps>) {
  const [review, setReview] = React.useState<SubmissionReviewDto | null>(null);
  const [quota, setQuota] = React.useState<CodeReviewQuotaDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [requesting, setRequesting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setReview(null);
    setError(null);
    Promise.all([getCodeReview(submissionId), getCodeReviewQuota()])
      .then(([existing, currentQuota]) => {
        if (!active) return;
        setReview(existing);
        setQuota(currentQuota);
      })
      .catch(() => {
        if (active) setError('Could not load the code review.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [submissionId]);

  const pending = review?.status === 'PENDING';

  React.useEffect(() => {
    if (!pending) return;
    let polls = 0;
    let active = true;
    const timer = setInterval(() => {
      polls += 1;
      void getCodeReview(submissionId)
        .then((latest) => {
          if (!active || !latest) return;
          setReview(latest);
        })
        .catch(() => undefined);
      if (polls >= MAX_POLLS) {
        clearInterval(timer);
        if (active) setError('The review is taking longer than usual. Check back in a moment.');
      }
    }, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pending, submissionId]);

  React.useEffect(() => {
    const lines =
      review?.status === 'COMPLETED'
        ? review.findings.flatMap((finding) => (finding.line === null ? [] : [finding.line]))
        : [];
    onFindingsChange(lines);
  }, [review, onFindingsChange]);

  const startReview = async () => {
    setRequesting(true);
    setError(null);
    try {
      const created = await requestCodeReview(submissionId);
      setReview(created);
      setQuota((current) =>
        current
          ? { ...current, used: current.used + 1, remaining: Math.max(0, current.remaining - 1) }
          : current,
      );
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setRequesting(false);
    }
  };

  const renderContent = (): React.ReactNode => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin text-(--color-text-muted)" />;
    }
    if (review?.status === 'COMPLETED') {
      return <ReviewBody review={review} onJumpToLine={onJumpToLine} />;
    }
    if (pending) {
      return (
        <p className="m-0 inline-flex items-center gap-2 text-sm text-(--color-text-muted)">
          <Loader2 className="h-4 w-4 animate-spin" />
          Reviewing your code…
        </p>
      );
    }
    if (review?.status === 'FAILED') {
      return (
        <p className="m-0 text-sm text-(--color-danger)">
          {review.failureReason ?? 'The review could not be completed.'}
        </p>
      );
    }
    if (!reviewable) {
      return (
        <p className="m-0 text-sm text-(--color-text-muted)">
          Reviews are available once a submission has finished running.
        </p>
      );
    }
    if (quota && !quota.enabled) {
      return (
        <p className="m-0 text-sm text-(--color-text-muted)">
          Code review is not enabled for your account yet.
        </p>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void startReview()}
          disabled={requesting || quota?.remaining === 0}
        >
          {requesting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <ScanSearch className="mr-1.5 h-4 w-4" />
          )}
          Review my code
        </Button>
        {quota && (
          <span className="text-xs text-(--color-text-muted)">
            {quota.remaining} of {quota.limit} reviews left today
          </span>
        )}
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-3 rounded-(--radius-sm) border border-(--color-border-subtle) p-4">
      <h4 className="m-0 flex items-center gap-1.5 text-sm font-semibold text-(--color-text-primary)">
        <ScanSearch className="h-4 w-4 text-(--color-text-muted)" aria-hidden="true" />
        Code review
      </h4>
      {renderContent()}
      {error && <p className="m-0 text-xs text-(--color-danger)">{error}</p>}
    </section>
  );
}
