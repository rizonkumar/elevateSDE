import Link from 'next/link';
import { Badge } from '@elevatesde/ui';
import type { SubmissionSummaryDto } from '@elevatesde/shared-types';
import { DIFFICULTY_LABEL, DIFFICULTY_VARIANT } from '@/lib/difficulty';

const LANGUAGE_LABEL: Record<SubmissionSummaryDto['language'], string> = {
  javascript: 'JavaScript',
  python: 'Python',
  cpp: 'C++',
};

const STATUS_VARIANT: Record<SubmissionSummaryDto['status'], 'success' | 'danger' | 'neutral'> = {
  QUEUED: 'neutral',
  RUNNING: 'neutral',
  ACCEPTED: 'success',
  WRONG_ANSWER: 'danger',
  RUNTIME_ERROR: 'danger',
  TIME_LIMIT_EXCEEDED: 'danger',
  COMPILE_ERROR: 'danger',
};

function submissionDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface SubmissionRowProps {
  submission: SubmissionSummaryDto;
}

export function SubmissionRow({ submission }: Readonly<SubmissionRowProps>) {
  return (
    <Link
      href={`/dashboard/assessment/${submission.problemId}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-4 transition-colors hover:border-(--color-accent)"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-(--color-text-primary)">
          {submission.problemTitle}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-(--color-text-muted)">
          <Badge variant={DIFFICULTY_VARIANT[submission.problemDifficulty]}>
            {DIFFICULTY_LABEL[submission.problemDifficulty]}
          </Badge>
          <span>{LANGUAGE_LABEL[submission.language]}</span>
          <span>·</span>
          <span>
            {submission.passedCount}/{submission.totalCount} passed
          </span>
          <span>·</span>
          <span>{submissionDate(submission.createdAt)}</span>
        </div>
      </div>
      <Badge variant={STATUS_VARIANT[submission.status]}>{submission.status}</Badge>
    </Link>
  );
}
