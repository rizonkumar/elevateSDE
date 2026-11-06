import { StudyGoalMetric, StudyGroupRole } from '@prisma/client';
import {
  ActiveGroupMembership,
  ActivityRecord,
  DateWindow,
  GoalRecord,
  GoalWindow,
  GoalWriteInput,
  GroupWriteInput,
  LedgerEntryRecord,
  MemberPointTotals,
  MemberRecord,
  MembershipRecord,
  OpenGoalRecord,
  RosterCandidateRecord,
  StudyGroupRecord,
  StudyGroupSummaryRecord,
} from '../read-models/study-group-records';

export class StudyGroupNameTakenError extends Error {
  constructor() {
    super('A study group with this name already exists in your organization.');
  }
}

export abstract class IStudyGroupRepository {
  abstract findGroup(groupId: string): Promise<StudyGroupRecord | null>;
  abstract listTenantGroups(tenantId: string, now: Date): Promise<StudyGroupSummaryRecord[]>;
  abstract listMembershipsForUser(userId: string, tenantId: string): Promise<MembershipRecord[]>;
  abstract findMembership(groupId: string, userId: string): Promise<MembershipRecord | null>;
  abstract listMembers(groupId: string, tenantId: string): Promise<MemberRecord[]>;
  abstract listMemberIdsByGroup(
    groupIds: readonly string[],
    tenantId: string,
  ): Promise<Map<string, string[]>>;
  abstract countMembers(groupId: string, tenantId: string): Promise<number>;
  abstract countOwners(groupId: string, tenantId: string): Promise<number>;
  abstract isTenantAdmin(userId: string, tenantId: string): Promise<boolean>;
  abstract createGroup(
    tenantId: string,
    createdById: string,
    input: GroupWriteInput,
    ownerIds: readonly string[],
  ): Promise<StudyGroupRecord>;
  abstract updateGroup(groupId: string, input: GroupWriteInput): Promise<StudyGroupRecord>;
  abstract archiveGroup(groupId: string, archivedAt: Date): Promise<void>;
  abstract filterTenantUserIds(tenantId: string, userIds: readonly string[]): Promise<string[]>;
  abstract addMembers(
    groupId: string,
    tenantId: string,
    userIds: readonly string[],
    role: StudyGroupRole,
  ): Promise<string[]>;
  abstract updateMemberRole(groupId: string, userId: string, role: StudyGroupRole): Promise<void>;
  abstract removeMember(groupId: string, userId: string): Promise<void>;
  abstract searchRosterCandidates(
    groupId: string,
    tenantId: string,
    query: string,
    limit: number,
  ): Promise<RosterCandidateRecord[]>;
  abstract listGoals(groupId: string): Promise<GoalRecord[]>;
  abstract findGoal(groupId: string, goalId: string): Promise<GoalRecord | null>;
  abstract countOpenGoals(groupId: string, now: Date): Promise<number>;
  abstract createGoal(groupId: string, tenantId: string, input: GoalWriteInput): Promise<GoalRecord>;
  abstract updateGoal(goalId: string, input: GoalWriteInput): Promise<GoalRecord>;
  abstract deleteGoal(goalId: string): Promise<void>;
  abstract markGoalCompleted(goalId: string, completedAt: Date): Promise<boolean>;
  abstract metricTotals(
    userIds: readonly string[],
    metric: StudyGoalMetric,
    window: GoalWindow,
  ): Promise<Map<string, number>>;
  abstract pointTotals(
    userIds: readonly string[],
    window: DateWindow,
  ): Promise<Map<string, MemberPointTotals>>;
  abstract recentActivity(userIds: readonly string[], limit: number): Promise<ActivityRecord[]>;
  abstract describeActivity(entries: readonly LedgerEntryRecord[]): Promise<ActivityRecord[]>;
  abstract listActiveMembershipsForUser(userId: string): Promise<ActiveGroupMembership[]>;
  abstract listInProgressGoals(groupIds: readonly string[], now: Date): Promise<OpenGoalRecord[]>;
}
