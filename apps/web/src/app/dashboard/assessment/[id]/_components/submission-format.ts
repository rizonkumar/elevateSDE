import type { AssessmentLanguage, SubmissionStatusValue } from '@elevatesde/shared-types';

export const LANGUAGE_LABEL: Record<AssessmentLanguage, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  go: 'Go',
};

export const MONACO_LANGUAGE: Record<AssessmentLanguage, string> = {
  javascript: 'javascript',
  python: 'python',
  cpp: 'cpp',
  java: 'java',
  go: 'go',
};

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatusValue, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Running',
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  RUNTIME_ERROR: 'Runtime Error',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  COMPILE_ERROR: 'Compile Error',
};

export function statusTextClass(status: SubmissionStatusValue): string {
  if (status === 'ACCEPTED') return 'text-(--color-success)';
  if (status === 'QUEUED' || status === 'RUNNING') return 'text-(--color-text-muted)';
  return 'text-(--color-danger)';
}

export function formatRuntime(ms: number): string {
  return `${Math.round(ms)} ms`;
}

export function formatMemory(kb: number): string {
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`;
  }
  return `${kb} KB`;
}
