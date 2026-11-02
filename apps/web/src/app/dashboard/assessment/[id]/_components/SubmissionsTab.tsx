'use client';

import * as React from 'react';
import { GitCompare, History, Loader2 } from 'lucide-react';
import type { SubmissionDetailDto, SubmissionSummaryDto } from '@elevatesde/shared-types';
import { getSubmission, listSubmissions } from '@/lib/assessments-api';
import { formatRelativeTime } from '@/lib/relative-time';
import { useAssessmentStore } from '@/store/assessment.store';
import { useToastStore } from '@/store/toast.store';
import { SubmissionDetail } from './SubmissionDetail';
import { SubmissionCompareModal } from './SubmissionCompareModal';
import {
  LANGUAGE_LABEL,
  SUBMISSION_STATUS_LABEL,
  formatMemory,
  formatRuntime,
  statusTextClass,
} from './submission-format';

const MAX_COMPARE = 2;

interface SubmissionsTabProps {
  problemId: string;
}

interface ComparePair {
  older: SubmissionDetailDto;
  newer: SubmissionDetailDto;
}

export function SubmissionsTab({ problemId }: Readonly<SubmissionsTabProps>) {
  const submissionsVersion = useAssessmentStore((state) => state.submissionsVersion);
  const [items, setItems] = React.useState<SubmissionSummaryDto[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [comparePair, setComparePair] = React.useState<ComparePair | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    listSubmissions(problemId, null)
      .then((page) => {
        if (!active) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        if (active) useToastStore.getState().addToast('Could not load submissions.', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [problemId, submissionsVersion]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await listSubmissions(problemId, nextCursor);
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      useToastStore.getState().addToast('Could not load more submissions.', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= MAX_COMPARE) return [current[1] ?? id, id];
      return [...current, id];
    });
  };

  const openCompare = async () => {
    const [firstId, secondId] = selected;
    if (!firstId || !secondId) return;
    setComparePair(null);
    setCompareOpen(true);
    try {
      const [first, second] = await Promise.all([getSubmission(firstId), getSubmission(secondId)]);
      const firstIsOlder = new Date(first.createdAt) <= new Date(second.createdAt);
      setComparePair(
        firstIsOlder ? { older: first, newer: second } : { older: second, newer: first },
      );
    } catch {
      setCompareOpen(false);
      useToastStore.getState().addToast('Could not load the submissions to compare.', 'error');
    }
  };

  if (openId) {
    return <SubmissionDetail submissionId={openId} onBack={() => setOpenId(null)} />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-(--color-text-muted)" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-12 text-center">
        <History className="mb-3 h-6 w-6 text-(--color-text-muted)" />
        <p className="m-0 text-sm text-(--color-text-muted)">
          Your submissions for this problem will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-xs text-(--color-text-muted)">
          Select two submissions to compare their code.
        </p>
        <button
          type="button"
          onClick={() => void openCompare()}
          disabled={selected.length !== MAX_COMPARE}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border-subtle) px-2.5 py-1.5 text-xs font-semibold text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) disabled:cursor-not-allowed disabled:opacity-40"
        >
          <GitCompare className="h-3.5 w-3.5" />
          Compare
        </button>
      </div>

      <ul className="m-0 list-none divide-y divide-(--color-border-subtle) overflow-hidden rounded-(--radius-sm) border border-(--color-border-subtle) p-0">
        {items.map((submission) => {
          const isSelected = selected.includes(submission.id);
          const finished = submission.status !== 'QUEUED' && submission.status !== 'RUNNING';
          return (
            <li key={submission.id} className="flex items-center gap-3 px-3 py-2.5">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelected(submission.id)}
                aria-label={`Select submission from ${formatRelativeTime(submission.createdAt)} for comparison`}
                className="h-4 w-4 shrink-0 cursor-pointer accent-(--color-accent)"
              />
              <button
                type="button"
                onClick={() => setOpenId(submission.id)}
                className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5 text-left sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-semibold ${statusTextClass(submission.status)}`}
                  >
                    {SUBMISSION_STATUS_LABEL[submission.status]}
                  </span>
                  <span className="block text-xs text-(--color-text-muted)">
                    {formatRelativeTime(submission.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-3 text-xs text-(--color-text-muted)">
                  <span className="w-20">{LANGUAGE_LABEL[submission.language]}</span>
                  <span className="w-14 tabular-nums">
                    {finished ? formatRuntime(submission.totalRuntimeMs) : '—'}
                  </span>
                  <span className="w-16 tabular-nums">
                    {finished ? formatMemory(submission.peakMemoryKb) : '—'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {nextCursor && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="inline-flex cursor-pointer items-center justify-center gap-2 self-center rounded-(--radius-sm) px-3 py-1.5 text-xs font-semibold text-(--color-text-muted) transition-colors hover:text-(--color-text-primary) disabled:opacity-50"
        >
          {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Load older submissions
        </button>
      )}

      <SubmissionCompareModal
        open={compareOpen}
        older={comparePair?.older ?? null}
        newer={comparePair?.newer ?? null}
        loading={comparePair === null}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  );
}
