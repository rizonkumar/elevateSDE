import type { SelectOption } from '@elevatesde/ui';
import {
  MOCK_INTERVIEW_DURATIONS,
  type InterviewCompanyStyle,
  type InterviewRoleLevel,
  type InterviewRoundType,
  type MockInterviewSessionStatus,
  type MockInterviewTopic,
  type PreparationTaskDto,
} from '@elevatesde/shared-types';

export const TOPIC_OPTIONS: SelectOption[] = [
  { value: 'SYSTEM_DESIGN', label: 'System Design' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'CODING', label: 'Coding' },
  { value: 'DSA', label: 'Data Structures & Algorithms' },
];

export const ROLE_OPTIONS: SelectOption[] = [
  { value: 'JUNIOR', label: 'Junior Engineer' },
  { value: 'MID', label: 'Mid-level Engineer' },
  { value: 'SENIOR', label: 'Senior Engineer' },
  { value: 'STAFF', label: 'Staff Engineer' },
];

export const STYLE_OPTIONS: SelectOption[] = [
  { value: 'GENERIC', label: 'Generic' },
  { value: 'FAANG', label: 'FAANG' },
  { value: 'STARTUP', label: 'High-growth Startup' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

export const DURATION_OPTIONS: SelectOption[] = MOCK_INTERVIEW_DURATIONS.map((minutes) => ({
  value: String(minutes),
  label: `${minutes} minutes`,
}));

export const TOPIC_LABELS = Object.fromEntries(
  TOPIC_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<MockInterviewTopic, string>;

export const ROLE_LABELS = Object.fromEntries(
  ROLE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<InterviewRoleLevel, string>;

export const STYLE_LABELS = Object.fromEntries(
  STYLE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<InterviewCompanyStyle, string>;

export const SESSION_STATUS_LABELS: Record<MockInterviewSessionStatus, string> = {
  ACTIVE: 'In progress',
  SCORING: 'Scoring',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  ABANDONED: 'Abandoned',
};

const TOPIC_FOR_ROUND: Record<InterviewRoundType, MockInterviewTopic> = {
  CODING: 'CODING',
  SYSTEM_DESIGN: 'SYSTEM_DESIGN',
  BEHAVIORAL: 'BEHAVIORAL',
  RESUME_ROLE_FIT: 'BEHAVIORAL',
  CUSTOM: 'CODING',
};

export function isMockInterviewTopic(value: string | null): value is MockInterviewTopic {
  return TOPIC_OPTIONS.some((option) => option.value === value);
}

export function preparationTaskLink(task: PreparationTaskDto, roundType: InterviewRoundType): string | null {
  if (task.type !== 'RUN_MOCK_INTERVIEW' || task.status === 'COMPLETED') return task.deepLink;
  const params = new URLSearchParams({ taskId: task.id, topic: TOPIC_FOR_ROUND[roundType] });
  return `/dashboard/mock-interview?${params.toString()}`;
}
