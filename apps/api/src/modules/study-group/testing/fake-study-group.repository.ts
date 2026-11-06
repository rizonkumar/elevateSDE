import { randomUUID } from 'node:crypto';
import { PointSource, StudyGoalMetric, StudyGroupRole } from '@prisma/client';
import {
  IStudyGroupRepository,
  StudyGroupNameTakenError,
} from '../domain/interfaces/study-group-repository.interface';
import { EARNING_SOURCES, LEDGER_SOURCE_FOR_COUNT_METRIC } from '../domain/goal-progress';
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
  activityId,
} from '../domain/read-models/study-group-records';

export interface FakeUser {
  id: string;
  tenantId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  isTenantAdmin?: boolean;
  active?: boolean;
}

interface StoredMember extends MembershipRecord {
  joinedAt: Date;
}

interface StoredParticipation {
  userId: string;
  contestEndsAt: Date;
}

export class FakeStudyGroupRepository implements IStudyGroupRepository {
  readonly users = new Map<string, FakeUser>();
  readonly groups = new Map<string, StudyGroupRecord>();
  readonly members: StoredMember[] = [];
  readonly goals = new Map<string, GoalRecord>();
  readonly ledger: LedgerEntryRecord[] = [];
  readonly participations: StoredParticipation[] = [];
  readonly completions: string[] = [];

  addUser(user: FakeUser): FakeUser {
    this.users.set(user.id, user);
    return user;
  }

  seedGroup(group: Partial<StudyGroupRecord> & { tenantId: string; name: string }): StudyGroupRecord {
    const record: StudyGroupRecord = {
      id: group.id ?? randomUUID(),
      tenantId: group.tenantId,
      name: group.name,
      description: group.description ?? null,
      joinPolicy: group.joinPolicy ?? 'INVITE_ONLY',
      archivedAt: group.archivedAt ?? null,
      createdAt: group.createdAt ?? new Date('2027-01-01T00:00:00.000Z'),
    };
    this.groups.set(record.id, record);
    return record;
  }

  seedMember(groupId: string, userId: string, role: StudyGroupRole = StudyGroupRole.MEMBER): void {
    this.members.push({ groupId, userId, role, joinedAt: new Date('2027-01-02T00:00:00.000Z') });
  }

  seedGoal(goal: Partial<GoalRecord> & { groupId: string }): GoalRecord {
    const record: GoalRecord = {
      id: goal.id ?? randomUUID(),
      groupId: goal.groupId,
      title: goal.title ?? 'Goal',
      metric: goal.metric ?? StudyGoalMetric.PROBLEMS_SOLVED,
      scope: goal.scope ?? 'GROUP_TOTAL',
      target: goal.target ?? 3,
      startsAt: goal.startsAt ?? new Date('2027-01-01T00:00:00.000Z'),
      endsAt: goal.endsAt ?? new Date('2027-12-31T00:00:00.000Z'),
      completedAt: goal.completedAt ?? null,
      createdAt: goal.createdAt ?? new Date('2027-01-01T00:00:00.000Z'),
    };
    this.goals.set(record.id, record);
    return record;
  }

  seedLedger(entry: Partial<LedgerEntryRecord> & { userId: string; source: PointSource }): void {
    this.ledger.push({
      userId: entry.userId,
      source: entry.source,
      refId: entry.refId ?? randomUUID(),
      delta: entry.delta ?? 10,
      createdAt: entry.createdAt ?? new Date('2027-02-01T00:00:00.000Z'),
    });
  }

  async findGroup(groupId: string): Promise<StudyGroupRecord | null> {
    return this.groups.get(groupId) ?? null;
  }

  async listTenantGroups(tenantId: string, now: Date): Promise<StudyGroupSummaryRecord[]> {
    return [...this.groups.values()]
      .filter((group) => group.tenantId === tenantId && group.archivedAt === null)
      .map((group) => ({
        ...group,
        memberCount: this.memberIds(group.id, tenantId).length,
        activeGoalCount: [...this.goals.values()].filter(
          (goal) => goal.groupId === group.id && goal.completedAt === null && goal.endsAt > now,
        ).length,
      }));
  }

  async listMembershipsForUser(userId: string, tenantId: string): Promise<MembershipRecord[]> {
    return this.members
      .filter((member) => member.userId === userId)
      .filter((member) => {
        const group = this.groups.get(member.groupId);
        return group?.tenantId === tenantId && group.archivedAt === null;
      })
      .map(({ groupId, role }) => ({ groupId, userId, role }));
  }

  async findMembership(groupId: string, userId: string): Promise<MembershipRecord | null> {
    const member = this.members.find(
      (candidate) => candidate.groupId === groupId && candidate.userId === userId,
    );
    return member ? { groupId, userId, role: member.role } : null;
  }

  async listMembers(groupId: string, tenantId: string): Promise<MemberRecord[]> {
    return this.members
      .filter((member) => member.groupId === groupId)
      .flatMap((member) => {
        const user = this.users.get(member.userId);
        if (!user || user.tenantId !== tenantId) {
          return [];
        }
        return [
          {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            headline: null,
            publicHandle: null,
            role: member.role,
            joinedAt: member.joinedAt,
          },
        ];
      });
  }

  async listMemberIdsByGroup(
    groupIds: readonly string[],
    tenantId: string,
  ): Promise<Map<string, string[]>> {
    return new Map(groupIds.map((groupId) => [groupId, this.memberIds(groupId, tenantId)]));
  }

  async countMembers(groupId: string, tenantId: string): Promise<number> {
    return this.memberIds(groupId, tenantId).length;
  }

  async countOwners(groupId: string, tenantId: string): Promise<number> {
    return this.members.filter(
      (member) =>
        member.groupId === groupId &&
        member.role === StudyGroupRole.OWNER &&
        this.users.get(member.userId)?.tenantId === tenantId,
    ).length;
  }

  async isTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
    const user = this.users.get(userId);
    return user?.tenantId === tenantId && user.isTenantAdmin === true;
  }

  async createGroup(
    tenantId: string,
    _createdById: string,
    input: GroupWriteInput,
    ownerIds: readonly string[],
  ): Promise<StudyGroupRecord> {
    this.assertNameFree(tenantId, input.name, null);
    const group = this.seedGroup({ tenantId, ...input });
    ownerIds.forEach((userId) => this.seedMember(group.id, userId, StudyGroupRole.OWNER));
    return group;
  }

  async updateGroup(groupId: string, input: GroupWriteInput): Promise<StudyGroupRecord> {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error('missing group');
    }
    this.assertNameFree(group.tenantId, input.name, groupId);
    const updated = { ...group, ...input };
    this.groups.set(groupId, updated);
    return updated;
  }

  async archiveGroup(groupId: string, archivedAt: Date): Promise<void> {
    const group = this.groups.get(groupId);
    if (group && group.archivedAt === null) {
      this.groups.set(groupId, { ...group, archivedAt });
    }
  }

  async filterTenantUserIds(tenantId: string, userIds: readonly string[]): Promise<string[]> {
    return userIds.filter((userId) => {
      const user = this.users.get(userId);
      return user?.tenantId === tenantId && user.active !== false;
    });
  }

  async addMembers(
    groupId: string,
    _tenantId: string,
    userIds: readonly string[],
    role: StudyGroupRole,
  ): Promise<string[]> {
    const added = userIds.filter(
      (userId) =>
        !this.members.some((member) => member.groupId === groupId && member.userId === userId),
    );
    added.forEach((userId) => this.seedMember(groupId, userId, role));
    return added;
  }

  async updateMemberRole(groupId: string, userId: string, role: StudyGroupRole): Promise<void> {
    const member = this.members.find(
      (candidate) => candidate.groupId === groupId && candidate.userId === userId,
    );
    if (member) {
      member.role = role;
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const index = this.members.findIndex(
      (candidate) => candidate.groupId === groupId && candidate.userId === userId,
    );
    if (index >= 0) {
      this.members.splice(index, 1);
    }
  }

  async searchRosterCandidates(
    groupId: string,
    tenantId: string,
    query: string,
    limit: number,
  ): Promise<RosterCandidateRecord[]> {
    const term = query.trim().toLowerCase();
    return [...this.users.values()]
      .filter((user) => user.tenantId === tenantId && user.active !== false)
      .filter(
        (user) =>
          !this.members.some((member) => member.groupId === groupId && member.userId === user.id),
      )
      .filter(
        (user) =>
          term.length === 0 ||
          `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(term),
      )
      .slice(0, limit)
      .map((user) => ({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        headline: null,
      }));
  }

  async listGoals(groupId: string): Promise<GoalRecord[]> {
    return [...this.goals.values()].filter((goal) => goal.groupId === groupId);
  }

  async findGoal(groupId: string, goalId: string): Promise<GoalRecord | null> {
    const goal = this.goals.get(goalId);
    return goal?.groupId === groupId ? goal : null;
  }

  async countOpenGoals(groupId: string, now: Date): Promise<number> {
    return [...this.goals.values()].filter(
      (goal) => goal.groupId === groupId && goal.completedAt === null && goal.endsAt > now,
    ).length;
  }

  async createGoal(groupId: string, _tenantId: string, input: GoalWriteInput): Promise<GoalRecord> {
    return this.seedGoal({ groupId, ...input });
  }

  async updateGoal(goalId: string, input: GoalWriteInput): Promise<GoalRecord> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error('missing goal');
    }
    const updated = { ...goal, ...input };
    this.goals.set(goalId, updated);
    return updated;
  }

  async deleteGoal(goalId: string): Promise<void> {
    this.goals.delete(goalId);
  }

  async markGoalCompleted(goalId: string, completedAt: Date): Promise<boolean> {
    const goal = this.goals.get(goalId);
    if (!goal || goal.completedAt !== null) {
      return false;
    }
    this.goals.set(goalId, { ...goal, completedAt });
    this.completions.push(goalId);
    return true;
  }

  async metricTotals(
    userIds: readonly string[],
    metric: StudyGoalMetric,
    window: GoalWindow,
  ): Promise<Map<string, number>> {
    const totals = new Map<string, number>();
    const within = (date: Date) => date >= window.from && date < window.to;
    if (metric === StudyGoalMetric.CONTESTS_ENTERED) {
      this.participations
        .filter((entry) => userIds.includes(entry.userId) && within(entry.contestEndsAt))
        .forEach((entry) => totals.set(entry.userId, (totals.get(entry.userId) ?? 0) + 1));
      return totals;
    }
    const countSource = LEDGER_SOURCE_FOR_COUNT_METRIC[metric];
    this.ledger
      .filter((entry) => userIds.includes(entry.userId) && within(entry.createdAt))
      .forEach((entry) => {
        if (metric === StudyGoalMetric.POINTS && EARNING_SOURCES.includes(entry.source)) {
          totals.set(entry.userId, (totals.get(entry.userId) ?? 0) + entry.delta);
        } else if (countSource && entry.source === countSource) {
          totals.set(entry.userId, (totals.get(entry.userId) ?? 0) + 1);
        }
      });
    return totals;
  }

  async pointTotals(
    userIds: readonly string[],
    window: DateWindow,
  ): Promise<Map<string, MemberPointTotals>> {
    const totals = new Map<string, MemberPointTotals>();
    this.ledger
      .filter((entry) => userIds.includes(entry.userId) && EARNING_SOURCES.includes(entry.source))
      .filter((entry) => !window.from || entry.createdAt >= window.from)
      .filter((entry) => !window.to || entry.createdAt < window.to)
      .forEach((entry) => {
        const current = totals.get(entry.userId) ?? { points: 0, problemsSolved: 0 };
        totals.set(entry.userId, {
          points: current.points + entry.delta,
          problemsSolved:
            current.problemsSolved + (entry.source === PointSource.PROBLEM_SOLVED ? 1 : 0),
        });
      });
    return totals;
  }

  async recentActivity(userIds: readonly string[], limit: number): Promise<ActivityRecord[]> {
    const entries = this.ledger
      .filter((entry) => userIds.includes(entry.userId) && EARNING_SOURCES.includes(entry.source))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
    return this.describeActivity(entries);
  }

  async describeActivity(entries: readonly LedgerEntryRecord[]): Promise<ActivityRecord[]> {
    return entries.flatMap((entry) => {
      const user = this.users.get(entry.userId);
      if (!user || entry.source === PointSource.ADMIN_ADJUSTMENT) {
        return [];
      }
      return [
        {
          id: activityId(entry.userId, entry.source, entry.refId),
          userId: entry.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          publicHandle: null,
          kind: entry.source,
          title: `Item ${entry.refId}`,
          linkUrl: null,
          points: entry.delta,
          occurredAt: entry.createdAt,
        },
      ];
    });
  }

  async listActiveMembershipsForUser(userId: string): Promise<ActiveGroupMembership[]> {
    const tenantId = this.users.get(userId)?.tenantId;
    if (!tenantId) {
      return [];
    }
    return this.members
      .filter((member) => member.userId === userId)
      .flatMap((member) => {
        const group = this.groups.get(member.groupId);
        return group && group.tenantId === tenantId && group.archivedAt === null
          ? [{ groupId: group.id, tenantId }]
          : [];
      });
  }

  async listInProgressGoals(groupIds: readonly string[], now: Date): Promise<OpenGoalRecord[]> {
    return [...this.goals.values()]
      .filter(
        (goal) =>
          groupIds.includes(goal.groupId) &&
          goal.completedAt === null &&
          goal.startsAt <= now &&
          goal.endsAt > now,
      )
      .map((goal) => ({ ...goal, groupName: this.groups.get(goal.groupId)?.name ?? '' }));
  }

  private memberIds(groupId: string, tenantId: string): string[] {
    return this.members
      .filter(
        (member) =>
          member.groupId === groupId && this.users.get(member.userId)?.tenantId === tenantId,
      )
      .map((member) => member.userId);
  }

  private assertNameFree(tenantId: string, name: string, exceptId: string | null): void {
    const taken = [...this.groups.values()].some(
      (group) =>
        group.tenantId === tenantId &&
        group.id !== exceptId &&
        group.name === name,
    );
    if (taken) {
      throw new StudyGroupNameTakenError();
    }
  }
}
