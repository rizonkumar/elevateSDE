import { Injectable } from '@nestjs/common';
import {
  AccountStatus,
  PointSource,
  Prisma,
  StudyGoalMetric,
  StudyGroupRole,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { isUniqueConstraintViolation } from '../../../../infrastructure/prisma/prisma-errors';
import { PUBLIC_HANDLE_SELECT, resolvePublicHandle } from '../../../../common/public-handle';
import {
  IStudyGroupRepository,
  StudyGroupNameTakenError,
} from '../../domain/interfaces/study-group-repository.interface';
import { EARNING_SOURCES, LEDGER_SOURCE_FOR_COUNT_METRIC } from '../../domain/goal-progress';
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
} from '../../domain/read-models/study-group-records';

const GROUP_SELECT = {
  id: true,
  tenantId: true,
  name: true,
  description: true,
  joinPolicy: true,
  archivedAt: true,
  createdAt: true,
} as const;

const GOAL_SELECT = {
  id: true,
  groupId: true,
  title: true,
  metric: true,
  scope: true,
  target: true,
  startsAt: true,
  endsAt: true,
  completedAt: true,
  createdAt: true,
} as const;

const EARNING_SOURCE_FILTER = { in: [...EARNING_SOURCES] };

@Injectable()
export class StudyGroupRepository implements IStudyGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGroup(groupId: string): Promise<StudyGroupRecord | null> {
    return this.prisma.studyGroup.findUnique({ where: { id: groupId }, select: GROUP_SELECT });
  }

  async listTenantGroups(tenantId: string, now: Date): Promise<StudyGroupSummaryRecord[]> {
    const groups = await this.prisma.studyGroup.findMany({
      where: { tenantId, archivedAt: null },
      orderBy: { name: 'asc' },
      select: {
        ...GROUP_SELECT,
        _count: {
          select: {
            members: { where: { user: { tenantId } } },
            goals: { where: { endsAt: { gt: now }, completedAt: null } },
          },
        },
      },
    });
    return groups.map(({ _count, ...group }) => ({
      ...group,
      memberCount: _count.members,
      activeGoalCount: _count.goals,
    }));
  }

  async listMembershipsForUser(userId: string, tenantId: string): Promise<MembershipRecord[]> {
    return this.prisma.studyGroupMember.findMany({
      where: { userId, tenantId, group: { archivedAt: null } },
      select: { groupId: true, userId: true, role: true },
    });
  }

  async findMembership(groupId: string, userId: string): Promise<MembershipRecord | null> {
    return this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { groupId: true, userId: true, role: true },
    });
  }

  async listMembers(groupId: string, tenantId: string): Promise<MemberRecord[]> {
    const members = await this.prisma.studyGroupMember.findMany({
      where: { groupId, user: { tenantId } },
      orderBy: { joinedAt: 'asc' },
      select: {
        userId: true,
        role: true,
        joinedAt: true,
        user: {
          select: { firstName: true, lastName: true, headline: true, ...PUBLIC_HANDLE_SELECT },
        },
      },
    });
    return members.map((member) => ({
      userId: member.userId,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      headline: member.user.headline,
      publicHandle: resolvePublicHandle(member.user),
      role: member.role,
      joinedAt: member.joinedAt,
    }));
  }

  async listMemberIdsByGroup(
    groupIds: readonly string[],
    tenantId: string,
  ): Promise<Map<string, string[]>> {
    const byGroup = new Map<string, string[]>(groupIds.map((groupId) => [groupId, []]));
    if (groupIds.length === 0) {
      return byGroup;
    }
    const rows = await this.prisma.studyGroupMember.findMany({
      where: { groupId: { in: [...groupIds] }, user: { tenantId } },
      select: { groupId: true, userId: true },
    });
    for (const row of rows) {
      byGroup.get(row.groupId)?.push(row.userId);
    }
    return byGroup;
  }

  async countMembers(groupId: string, tenantId: string): Promise<number> {
    return this.prisma.studyGroupMember.count({ where: { groupId, user: { tenantId } } });
  }

  async countOwners(groupId: string, tenantId: string): Promise<number> {
    return this.prisma.studyGroupMember.count({
      where: { groupId, role: StudyGroupRole.OWNER, user: { tenantId } },
    });
  }

  async isTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        id: userId,
        tenantId,
        role: UserRole.TENANT_ADMIN,
        status: AccountStatus.ACTIVE,
      },
    });
    return count > 0;
  }

  async createGroup(
    tenantId: string,
    createdById: string,
    input: GroupWriteInput,
    ownerIds: readonly string[],
  ): Promise<StudyGroupRecord> {
    try {
      return await this.prisma.studyGroup.create({
        data: {
          tenantId,
          createdById,
          name: input.name,
          description: input.description,
          joinPolicy: input.joinPolicy,
          members: {
            create: ownerIds.map((userId) => ({
              userId,
              tenantId,
              role: StudyGroupRole.OWNER,
            })),
          },
        },
        select: GROUP_SELECT,
      });
    } catch (error) {
      throw translateNameConflict(error);
    }
  }

  async updateGroup(groupId: string, input: GroupWriteInput): Promise<StudyGroupRecord> {
    try {
      return await this.prisma.studyGroup.update({
        where: { id: groupId },
        data: input,
        select: GROUP_SELECT,
      });
    } catch (error) {
      throw translateNameConflict(error);
    }
  }

  async archiveGroup(groupId: string, archivedAt: Date): Promise<void> {
    await this.prisma.studyGroup.updateMany({
      where: { id: groupId, archivedAt: null },
      data: { archivedAt },
    });
  }

  async filterTenantUserIds(tenantId: string, userIds: readonly string[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...userIds] }, tenantId, status: AccountStatus.ACTIVE },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  async addMembers(
    groupId: string,
    tenantId: string,
    userIds: readonly string[],
    role: StudyGroupRole,
  ): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }
    const existing = await this.prisma.studyGroupMember.findMany({
      where: { groupId, userId: { in: [...userIds] } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((member) => member.userId));
    const additions = userIds.filter((userId) => !existingIds.has(userId));
    if (additions.length === 0) {
      return [];
    }
    await this.prisma.studyGroupMember.createMany({
      data: additions.map((userId) => ({ groupId, userId, tenantId, role })),
      skipDuplicates: true,
    });
    return additions;
  }

  async updateMemberRole(groupId: string, userId: string, role: StudyGroupRole): Promise<void> {
    await this.prisma.studyGroupMember.updateMany({ where: { groupId, userId }, data: { role } });
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await this.prisma.studyGroupMember.deleteMany({ where: { groupId, userId } });
  }

  async searchRosterCandidates(
    groupId: string,
    tenantId: string,
    query: string,
    limit: number,
  ): Promise<RosterCandidateRecord[]> {
    const term = query.trim();
    const where: Prisma.UserWhereInput = {
      tenantId,
      status: AccountStatus.ACTIVE,
      studyGroupMemberships: { none: { groupId } },
    };
    if (term.length > 0) {
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }
    const users = await this.prisma.user.findMany({
      where,
      orderBy: [{ firstName: 'asc' }, { email: 'asc' }],
      take: limit,
      select: { id: true, firstName: true, lastName: true, email: true, headline: true },
    });
    return users.map(({ id, ...user }) => ({ userId: id, ...user }));
  }

  async listGoals(groupId: string): Promise<GoalRecord[]> {
    return this.prisma.studyGroupGoal.findMany({
      where: { groupId },
      orderBy: [{ endsAt: 'asc' }, { createdAt: 'asc' }],
      select: GOAL_SELECT,
    });
  }

  async findGoal(groupId: string, goalId: string): Promise<GoalRecord | null> {
    return this.prisma.studyGroupGoal.findFirst({
      where: { id: goalId, groupId },
      select: GOAL_SELECT,
    });
  }

  async countOpenGoals(groupId: string, now: Date): Promise<number> {
    return this.prisma.studyGroupGoal.count({
      where: { groupId, completedAt: null, endsAt: { gt: now } },
    });
  }

  async createGoal(groupId: string, tenantId: string, input: GoalWriteInput): Promise<GoalRecord> {
    return this.prisma.studyGroupGoal.create({
      data: { ...input, groupId, tenantId },
      select: GOAL_SELECT,
    });
  }

  async updateGoal(goalId: string, input: GoalWriteInput): Promise<GoalRecord> {
    return this.prisma.studyGroupGoal.update({
      where: { id: goalId },
      data: input,
      select: GOAL_SELECT,
    });
  }

  async deleteGoal(goalId: string): Promise<void> {
    await this.prisma.studyGroupGoal.deleteMany({ where: { id: goalId } });
  }

  async markGoalCompleted(goalId: string, completedAt: Date): Promise<boolean> {
    const result = await this.prisma.studyGroupGoal.updateMany({
      where: { id: goalId, completedAt: null },
      data: { completedAt },
    });
    return result.count > 0;
  }

  async metricTotals(
    userIds: readonly string[],
    metric: StudyGoalMetric,
    window: GoalWindow,
  ): Promise<Map<string, number>> {
    const totals = new Map<string, number>();
    if (userIds.length === 0) {
      return totals;
    }
    const inWindow = { gte: window.from, lt: window.to };
    if (metric === StudyGoalMetric.CONTESTS_ENTERED) {
      const rows = await this.prisma.contestParticipant.groupBy({
        by: ['userId'],
        where: { userId: { in: [...userIds] }, contest: { endsAt: inWindow } },
        _count: { _all: true },
      });
      rows.forEach((row) => totals.set(row.userId, row._count._all));
      return totals;
    }
    if (metric === StudyGoalMetric.POINTS) {
      const rows = await this.prisma.pointLedger.groupBy({
        by: ['userId'],
        where: {
          userId: { in: [...userIds] },
          source: EARNING_SOURCE_FILTER,
          createdAt: inWindow,
        },
        _sum: { delta: true },
      });
      rows.forEach((row) => totals.set(row.userId, row._sum.delta ?? 0));
      return totals;
    }
    const source = LEDGER_SOURCE_FOR_COUNT_METRIC[metric];
    if (!source) {
      return totals;
    }
    const rows = await this.prisma.pointLedger.groupBy({
      by: ['userId'],
      where: { userId: { in: [...userIds] }, source, createdAt: inWindow },
      _count: { _all: true },
    });
    rows.forEach((row) => totals.set(row.userId, row._count._all));
    return totals;
  }

  async pointTotals(
    userIds: readonly string[],
    window: DateWindow,
  ): Promise<Map<string, MemberPointTotals>> {
    const totals = new Map<string, MemberPointTotals>();
    if (userIds.length === 0) {
      return totals;
    }
    const createdAt: Prisma.DateTimeFilter = {};
    if (window.from) {
      createdAt.gte = window.from;
    }
    if (window.to) {
      createdAt.lt = window.to;
    }
    const rows = await this.prisma.pointLedger.groupBy({
      by: ['userId', 'source'],
      where: { userId: { in: [...userIds] }, source: EARNING_SOURCE_FILTER, createdAt },
      _sum: { delta: true },
      _count: { _all: true },
    });
    for (const row of rows) {
      const current = totals.get(row.userId) ?? { points: 0, problemsSolved: 0 };
      totals.set(row.userId, {
        points: current.points + (row._sum.delta ?? 0),
        problemsSolved:
          current.problemsSolved +
          (row.source === PointSource.PROBLEM_SOLVED ? row._count._all : 0),
      });
    }
    return totals;
  }

  async recentActivity(userIds: readonly string[], limit: number): Promise<ActivityRecord[]> {
    if (userIds.length === 0) {
      return [];
    }
    const entries = await this.prisma.pointLedger.findMany({
      where: { userId: { in: [...userIds] }, source: EARNING_SOURCE_FILTER },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { userId: true, source: true, refId: true, delta: true, createdAt: true },
    });
    return this.describeActivity(entries);
  }

  async describeActivity(entries: readonly LedgerEntryRecord[]): Promise<ActivityRecord[]> {
    if (entries.length === 0) {
      return [];
    }
    const refIdsFor = (source: PointSource) => [
      ...new Set(entries.filter((entry) => entry.source === source).map((entry) => entry.refId)),
    ];
    const [users, problems, challenges, contests] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: [...new Set(entries.map((entry) => entry.userId))] } },
        select: { id: true, firstName: true, lastName: true, ...PUBLIC_HANDLE_SELECT },
      }),
      this.prisma.problem.findMany({
        where: { id: { in: refIdsFor(PointSource.PROBLEM_SOLVED) } },
        select: { id: true, title: true },
      }),
      this.prisma.dailyChallenge.findMany({
        where: { id: { in: refIdsFor(PointSource.DAILY_CHALLENGE) } },
        select: { id: true, problem: { select: { title: true } } },
      }),
      this.prisma.contest.findMany({
        where: { id: { in: refIdsFor(PointSource.CONTEST_RESULT) } },
        select: { id: true, slug: true, title: true },
      }),
    ]);
    const usersById = new Map(users.map((user) => [user.id, user]));
    const problemTitles = new Map(problems.map((problem) => [problem.id, problem.title]));
    const challengeTitles = new Map(
      challenges.map((challenge) => [challenge.id, challenge.problem.title]),
    );
    const contestsById = new Map(contests.map((contest) => [contest.id, contest]));
    return entries.flatMap((entry) => {
      const user = usersById.get(entry.userId);
      const subject = describeSubject(entry, problemTitles, challengeTitles, contestsById);
      if (!user || !subject) {
        return [];
      }
      return [
        {
          id: activityId(entry.userId, entry.source, entry.refId),
          userId: entry.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          publicHandle: resolvePublicHandle(user),
          kind: subject.kind,
          title: subject.title,
          linkUrl: subject.linkUrl,
          points: entry.delta,
          occurredAt: entry.createdAt,
        },
      ];
    });
  }

  async listActiveMembershipsForUser(userId: string): Promise<ActiveGroupMembership[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!user?.tenantId) {
      return [];
    }
    const memberships = await this.prisma.studyGroupMember.findMany({
      where: { userId, tenantId: user.tenantId, group: { archivedAt: null } },
      select: { groupId: true, tenantId: true },
    });
    return memberships;
  }

  async listInProgressGoals(groupIds: readonly string[], now: Date): Promise<OpenGoalRecord[]> {
    if (groupIds.length === 0) {
      return [];
    }
    const goals = await this.prisma.studyGroupGoal.findMany({
      where: {
        groupId: { in: [...groupIds] },
        completedAt: null,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      select: { ...GOAL_SELECT, group: { select: { name: true } } },
    });
    return goals.map(({ group, ...goal }) => ({ ...goal, groupName: group.name }));
  }
}

interface ActivitySubject {
  kind: ActivityRecord['kind'];
  title: string;
  linkUrl: string | null;
}

function describeSubject(
  entry: LedgerEntryRecord,
  problemTitles: ReadonlyMap<string, string>,
  challengeTitles: ReadonlyMap<string, string>,
  contests: ReadonlyMap<string, { slug: string; title: string }>,
): ActivitySubject | null {
  if (entry.source === PointSource.PROBLEM_SOLVED) {
    const title = problemTitles.get(entry.refId);
    return title
      ? { kind: 'PROBLEM_SOLVED', title, linkUrl: `/dashboard/assessment/${entry.refId}` }
      : null;
  }
  if (entry.source === PointSource.DAILY_CHALLENGE) {
    return {
      kind: 'DAILY_CHALLENGE',
      title: challengeTitles.get(entry.refId) ?? 'Daily challenge',
      linkUrl: '/dashboard/daily',
    };
  }
  if (entry.source === PointSource.CONTEST_RESULT) {
    const contest = contests.get(entry.refId);
    return contest
      ? {
          kind: 'CONTEST_RESULT',
          title: contest.title,
          linkUrl: `/dashboard/contests/${contest.slug}/standings`,
        }
      : null;
  }
  return null;
}

function translateNameConflict(error: unknown): unknown {
  return isUniqueConstraintViolation(error) ? new StudyGroupNameTakenError() : error;
}
