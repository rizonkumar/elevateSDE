import {
  PointSource,
  StudyGoalMetric,
  StudyGoalScope,
  StudyGroupJoinPolicy,
  StudyGroupRole,
} from '@prisma/client';

export interface StudyGroupRecord {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  joinPolicy: StudyGroupJoinPolicy;
  archivedAt: Date | null;
  createdAt: Date;
}

export interface StudyGroupSummaryRecord extends StudyGroupRecord {
  memberCount: number;
  activeGoalCount: number;
}

export interface MembershipRecord {
  groupId: string;
  userId: string;
  role: StudyGroupRole;
}

export interface MemberRecord {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  publicHandle: string | null;
  role: StudyGroupRole;
  joinedAt: Date;
}

export interface GoalRecord {
  id: string;
  groupId: string;
  title: string;
  metric: StudyGoalMetric;
  scope: StudyGoalScope;
  target: number;
  startsAt: Date;
  endsAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

export interface OpenGoalRecord extends GoalRecord {
  groupName: string;
}

export interface MemberPointTotals {
  points: number;
  problemsSolved: number;
}

export interface DateWindow {
  from: Date | null;
  to: Date | null;
}

export interface GoalWindow {
  from: Date;
  to: Date;
}

export interface LedgerEntryRecord {
  userId: string;
  source: PointSource;
  refId: string;
  delta: number;
  createdAt: Date;
}

export type ActivityKind = 'PROBLEM_SOLVED' | 'DAILY_CHALLENGE' | 'CONTEST_RESULT';

export interface ActivityRecord {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  publicHandle: string | null;
  kind: ActivityKind;
  title: string;
  linkUrl: string | null;
  points: number;
  occurredAt: Date;
}

export interface RosterCandidateRecord {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  headline: string | null;
}

export interface GroupWriteInput {
  name: string;
  description: string | null;
  joinPolicy: StudyGroupJoinPolicy;
}

export interface GoalWriteInput {
  title: string;
  metric: StudyGoalMetric;
  scope: StudyGoalScope;
  target: number;
  startsAt: Date;
  endsAt: Date;
}

export interface ActiveGroupMembership {
  groupId: string;
  tenantId: string;
}

export function activityId(userId: string, source: PointSource, refId: string): string {
  return `${userId}:${source}:${refId}`;
}
