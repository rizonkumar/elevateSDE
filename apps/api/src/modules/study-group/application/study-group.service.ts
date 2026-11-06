import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StudyGroupJoinPolicy, StudyGroupRole } from '@prisma/client';
import { buildDisplayName } from '../../../common/display-name';
import {
  NOTIFICATION_EVENTS,
  StudyGroupAddedEvent,
} from '../../notification/domain/events/notification-events';
import {
  IStudyGroupRepository,
  StudyGroupNameTakenError,
} from '../domain/interfaces/study-group-repository.interface';
import {
  GroupAccess,
  StudyGroupActor,
  TenantActor,
  canRemoveMember,
  hasTenant,
  resolveGroupAccess,
  wouldLeaveGroupWithoutOwner,
} from '../domain/policies/study-group-access';
import {
  RuleResult,
  exceedsGoalLimit,
  exceedsMemberLimit,
  normalizeGoalDraft,
  normalizeGroupDraft,
} from '../domain/policies/study-group-rules';
import { computeGoalProgress, goalStatus, goalWindow } from '../domain/goal-progress';
import {
  LeaderboardWindow,
  rankMembers,
  resolveLeaderboardWindow,
} from '../domain/group-leaderboard';
import { RealtimePublisher } from '../../realtime/domain/realtime-publisher';
import { periodStart } from '../../leaderboard/domain/point-periods';
import {
  ActivityRecord,
  GoalRecord,
  GoalWriteInput,
  MemberRecord,
  StudyGroupRecord,
} from '../domain/read-models/study-group-records';
import {
  RosterCandidateView,
  StudyGroupActivityView,
  StudyGroupDetailView,
  StudyGroupGoalView,
  StudyGroupLeaderboardView,
  StudyGroupListView,
  StudyGroupMemberView,
  StudyGroupSummaryView,
} from '../domain/read-models/study-group-views';
import { STUDY_GROUP_LIMITS } from '@elevatesde/shared-types';

export const NO_ORGANIZATION_MESSAGE =
  'Study groups are available to members of an organization. Join your team to use them.';
const GROUP_NOT_FOUND_MESSAGE = 'Study group not found.';
const ACTIVITY_LIMIT = 50;
const ROSTER_LIMIT = 20;
const FINISHED_GOALS_SHOWN = 10;

export interface GroupDraftInput {
  name: string;
  description?: string | null;
  joinPolicy: StudyGroupJoinPolicy;
}

export interface CreateGroupInput extends GroupDraftInput {
  ownerIds?: string[];
}

export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
  joinPolicy?: StudyGroupJoinPolicy;
}

interface LoadedGroup {
  actor: TenantActor;
  group: StudyGroupRecord;
  access: GroupAccess;
}

@Injectable()
export class StudyGroupService {
  constructor(
    private readonly repository: IStudyGroupRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly realtime: RealtimePublisher,
  ) {}

  async list(actor: StudyGroupActor, now: Date = new Date()): Promise<StudyGroupListView> {
    const tenantActor = requireTenant(actor);
    const [groups, memberships] = await Promise.all([
      this.repository.listTenantGroups(tenantActor.tenantId, now),
      this.repository.listMembershipsForUser(tenantActor.userId, tenantActor.tenantId),
    ]);
    const roles = new Map(memberships.map((membership) => [membership.groupId, membership.role]));
    const mine = groups.filter((group) => roles.has(group.id));
    const ranks = await this.weeklyRanks(
      mine.map((group) => group.id),
      tenantActor,
      now,
    );
    const toSummary = (group: (typeof groups)[number]): StudyGroupSummaryView => ({
      id: group.id,
      name: group.name,
      description: group.description,
      joinPolicy: group.joinPolicy,
      memberCount: group.memberCount,
      activeGoalCount: group.activeGoalCount,
      myRole: roles.get(group.id) ?? null,
      myWeeklyRank: ranks.get(group.id) ?? null,
      createdAt: group.createdAt,
    });
    return {
      canCreate: tenantActor.isTenantAdmin,
      groups: mine.map(toSummary),
      discoverable: groups
        .filter(
          (group) =>
            !roles.has(group.id) &&
            (tenantActor.isTenantAdmin || group.joinPolicy === StudyGroupJoinPolicy.OPEN),
        )
        .map(toSummary),
    };
  }

  async create(
    actor: StudyGroupActor,
    input: CreateGroupInput,
    now: Date = new Date(),
  ): Promise<StudyGroupDetailView> {
    const tenantActor = requireTenant(actor);
    if (!tenantActor.isTenantAdmin) {
      throw new ForbiddenException('Only organization admins can create study groups.');
    }
    const draft = unwrap(normalizeGroupDraft(input));
    const requestedOwners = uniqueIds(input.ownerIds ?? []);
    const ownerIds = requestedOwners.length > 0 ? requestedOwners : [tenantActor.userId];
    const validOwners = await this.repository.filterTenantUserIds(tenantActor.tenantId, ownerIds);
    if (validOwners.length !== ownerIds.length) {
      throw new BadRequestException('Owners must be active members of your organization.');
    }
    const group = await this.mapNameConflict(() =>
      this.repository.createGroup(tenantActor.tenantId, tenantActor.userId, draft, ownerIds),
    );
    this.announceAdded(group, ownerIds, tenantActor, now);
    return this.getDetail(tenantActor, group.id, now);
  }

  async getDetail(
    actor: StudyGroupActor,
    groupId: string,
    now: Date = new Date(),
  ): Promise<StudyGroupDetailView> {
    const { actor: tenantActor, group, access } = await this.loadViewable(actor, groupId);
    const [members, goals] = await Promise.all([
      this.repository.listMembers(group.id, group.tenantId),
      this.repository.listGoals(group.id),
    ]);
    const goalViews = await this.buildGoalViews(
      selectVisibleGoals(goals, now),
      members,
      tenantActor.userId,
      now,
    );
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      joinPolicy: group.joinPolicy,
      memberCount: members.length,
      createdAt: group.createdAt,
      access,
      members: members.map((member) => toMemberView(member, tenantActor.userId)),
      goals: goalViews,
    };
  }

  async update(
    actor: StudyGroupActor,
    groupId: string,
    input: UpdateGroupInput,
  ): Promise<StudyGroupDetailView> {
    const { actor: tenantActor, group, access } = await this.loadViewable(actor, groupId);
    if (!access.canEdit) {
      throw new ForbiddenException('Only group owners and organization admins can edit a group.');
    }
    const draft = unwrap(
      normalizeGroupDraft({
        name: input.name ?? group.name,
        description: input.description === undefined ? group.description : input.description,
        joinPolicy: input.joinPolicy ?? group.joinPolicy,
      }),
    );
    await this.mapNameConflict(() => this.repository.updateGroup(group.id, draft));
    return this.getDetail(tenantActor, group.id);
  }

  async archive(actor: StudyGroupActor, groupId: string, now: Date = new Date()): Promise<void> {
    const { group, access } = await this.loadViewable(actor, groupId);
    if (!access.canArchive) {
      throw new ForbiddenException('Only organization admins can archive a study group.');
    }
    await this.repository.archiveGroup(group.id, now);
    this.realtime.evictAllFromGroup(group.id);
  }

  async join(actor: StudyGroupActor, groupId: string): Promise<StudyGroupDetailView> {
    const { actor: tenantActor, group, access } = await this.loadViewable(actor, groupId);
    if (access.isMember) {
      return this.getDetail(tenantActor, group.id);
    }
    if (!access.canJoin) {
      throw new ForbiddenException('This group is invite only.');
    }
    await this.assertRoomFor(group, 1);
    await this.repository.addMembers(
      group.id,
      group.tenantId,
      [tenantActor.userId],
      StudyGroupRole.MEMBER,
    );
    return this.getDetail(tenantActor, group.id);
  }

  async leave(actor: StudyGroupActor, groupId: string): Promise<void> {
    const { actor: tenantActor, group, access } = await this.loadViewable(actor, groupId);
    if (!access.isMember || !access.role) {
      throw new BadRequestException('You are not a member of this group.');
    }
    await this.assertOwnerRemains(group, access.role, null, tenantActor);
    await this.repository.removeMember(group.id, tenantActor.userId);
    this.realtime.evictUserFromGroup(group.id, tenantActor.userId);
  }

  async addMembers(
    actor: StudyGroupActor,
    groupId: string,
    userIds: string[],
  ): Promise<StudyGroupDetailView> {
    const { actor: tenantActor, group, access } = await this.loadViewable(actor, groupId);
    if (!access.canManageMembers) {
      throw new ForbiddenException('Only group owners and organization admins can add members.');
    }
    const requested = uniqueIds(userIds);
    if (requested.length === 0) {
      throw new BadRequestException('Choose at least one person to add.');
    }
    const valid = await this.repository.filterTenantUserIds(group.tenantId, requested);
    if (valid.length !== requested.length) {
      throw new BadRequestException('Members must be active members of your organization.');
    }
    await this.assertRoomFor(group, requested.length);
    const added = await this.repository.addMembers(
      group.id,
      group.tenantId,
      requested,
      StudyGroupRole.MEMBER,
    );
    this.announceAdded(group, added, tenantActor, new Date());
    return this.getDetail(tenantActor, group.id);
  }

  async updateMemberRole(
    actor: StudyGroupActor,
    groupId: string,
    userId: string,
    role: StudyGroupRole,
  ): Promise<StudyGroupDetailView> {
    const { actor: tenantActor, group, access } = await this.loadViewable(actor, groupId);
    if (!access.canAssignRoles) {
      throw new ForbiddenException('Only organization admins can change member roles.');
    }
    const membership = await this.requireMember(group.id, userId);
    await this.assertOwnerRemains(group, membership.role, role, tenantActor);
    await this.repository.updateMemberRole(group.id, userId, role);
    return this.getDetail(tenantActor, group.id);
  }

  async removeMember(
    actor: StudyGroupActor,
    groupId: string,
    userId: string,
  ): Promise<StudyGroupDetailView> {
    const { actor: tenantActor, group, access } = await this.loadViewable(actor, groupId);
    const membership = await this.requireMember(group.id, userId);
    if (!canRemoveMember(access, tenantActor.userId, userId, membership.role)) {
      throw new ForbiddenException(
        membership.role === StudyGroupRole.OWNER
          ? 'Only organization admins can remove a group owner.'
          : 'Only group owners and organization admins can remove members.',
      );
    }
    await this.assertOwnerRemains(group, membership.role, null, tenantActor);
    await this.repository.removeMember(group.id, userId);
    this.realtime.evictUserFromGroup(group.id, userId);
    return this.getDetail(tenantActor, group.id);
  }

  async rosterCandidates(
    actor: StudyGroupActor,
    groupId: string,
    query: string,
  ): Promise<RosterCandidateView[]> {
    const { group, access } = await this.loadViewable(actor, groupId);
    if (!access.canManageMembers) {
      throw new ForbiddenException('Only group owners and organization admins can add members.');
    }
    const candidates = await this.repository.searchRosterCandidates(
      group.id,
      group.tenantId,
      query.slice(0, 100),
      ROSTER_LIMIT,
    );
    return candidates.map((candidate) => ({
      userId: candidate.userId,
      displayName: buildDisplayName(candidate.firstName, candidate.lastName),
      email: candidate.email,
      headline: candidate.headline,
    }));
  }

  async createGoal(
    actor: StudyGroupActor,
    groupId: string,
    input: GoalWriteInput,
    now: Date = new Date(),
  ): Promise<StudyGroupDetailView> {
    const { actor: tenantActor, group } = await this.loadGoalManager(actor, groupId);
    const draft = unwrap(normalizeGoalDraft(input));
    if (draft.endsAt.getTime() <= now.getTime()) {
      throw new BadRequestException('The goal must end in the future.');
    }
    if (exceedsGoalLimit(await this.repository.countOpenGoals(group.id, now))) {
      throw new BadRequestException(
        `A group can have at most ${STUDY_GROUP_LIMITS.maxActiveGoals} active goals.`,
      );
    }
    await this.repository.createGoal(group.id, group.tenantId, draft);
    return this.getDetail(tenantActor, group.id, now);
  }

  async updateGoal(
    actor: StudyGroupActor,
    groupId: string,
    goalId: string,
    input: GoalWriteInput,
  ): Promise<StudyGroupDetailView> {
    const { actor: tenantActor, group } = await this.loadGoalManager(actor, groupId);
    await this.requireGoal(group.id, goalId);
    const draft = unwrap(normalizeGoalDraft(input));
    await this.repository.updateGoal(goalId, draft);
    return this.getDetail(tenantActor, group.id);
  }

  async deleteGoal(
    actor: StudyGroupActor,
    groupId: string,
    goalId: string,
  ): Promise<StudyGroupDetailView> {
    const { actor: tenantActor, group } = await this.loadGoalManager(actor, groupId);
    await this.requireGoal(group.id, goalId);
    await this.repository.deleteGoal(goalId);
    return this.getDetail(tenantActor, group.id);
  }

  async leaderboard(
    actor: StudyGroupActor,
    groupId: string,
    window: LeaderboardWindow,
    now: Date = new Date(),
  ): Promise<StudyGroupLeaderboardView> {
    const { actor: tenantActor, group } = await this.loadViewable(actor, groupId);
    const [members, goals] = await Promise.all([
      this.repository.listMembers(group.id, group.tenantId),
      this.repository.listGoals(group.id),
    ]);
    const resolved = resolveLeaderboardWindow(window, goals, now);
    const totals = await this.repository.pointTotals(
      members.map((member) => member.userId),
      { from: resolved.from, to: resolved.to },
    );
    const entries = rankMembers(
      members.map((member) => ({
        userId: member.userId,
        displayName: buildDisplayName(member.firstName, member.lastName),
        publicHandle: member.publicHandle,
      })),
      totals,
      tenantActor.userId,
    );
    return { ...resolved, entries };
  }

  async activity(actor: StudyGroupActor, groupId: string): Promise<StudyGroupActivityView[]> {
    const { group } = await this.loadViewable(actor, groupId);
    const memberIds =
      (await this.repository.listMemberIdsByGroup([group.id], group.tenantId)).get(group.id) ?? [];
    const records = await this.repository.recentActivity(memberIds, ACTIVITY_LIMIT);
    return records.map(toActivityView);
  }

  async canJoinRoom(userId: string, tenantId: string | null, groupId: string): Promise<boolean> {
    if (!tenantId) {
      return false;
    }
    const group = await this.repository.findGroup(groupId);
    if (!group || group.tenantId !== tenantId) {
      return false;
    }
    const [membership, isTenantAdmin] = await Promise.all([
      this.repository.findMembership(group.id, userId),
      this.repository.isTenantAdmin(userId, tenantId),
    ]);
    return resolveGroupAccess(
      { userId, tenantId, isTenantAdmin, displayName: '' },
      group,
      membership?.role ?? null,
    ).canView;
  }

  private async loadViewable(actor: StudyGroupActor, groupId: string): Promise<LoadedGroup> {
    const tenantActor = requireTenant(actor);
    const group = await this.repository.findGroup(groupId);
    if (!group) {
      throw new NotFoundException(GROUP_NOT_FOUND_MESSAGE);
    }
    const membership =
      group.tenantId === tenantActor.tenantId
        ? await this.repository.findMembership(group.id, tenantActor.userId)
        : null;
    const access = resolveGroupAccess(tenantActor, group, membership?.role ?? null);
    if (!access.canView) {
      throw new NotFoundException(GROUP_NOT_FOUND_MESSAGE);
    }
    return { actor: tenantActor, group, access };
  }

  private async loadGoalManager(actor: StudyGroupActor, groupId: string): Promise<LoadedGroup> {
    const loaded = await this.loadViewable(actor, groupId);
    if (!loaded.access.canManageGoals) {
      throw new ForbiddenException('Only group owners and organization admins can manage goals.');
    }
    return loaded;
  }

  private async requireMember(groupId: string, userId: string) {
    const membership = await this.repository.findMembership(groupId, userId);
    if (!membership) {
      throw new NotFoundException('That person is not a member of this group.');
    }
    return membership;
  }

  private async requireGoal(groupId: string, goalId: string): Promise<GoalRecord> {
    const goal = await this.repository.findGoal(groupId, goalId);
    if (!goal) {
      throw new NotFoundException('Goal not found.');
    }
    return goal;
  }

  private async assertRoomFor(group: StudyGroupRecord, additions: number): Promise<void> {
    const count = await this.repository.countMembers(group.id, group.tenantId);
    if (exceedsMemberLimit(count, additions)) {
      throw new BadRequestException(
        `A group can have at most ${STUDY_GROUP_LIMITS.maxMembers} members.`,
      );
    }
  }

  private async assertOwnerRemains(
    group: StudyGroupRecord,
    targetRole: StudyGroupRole,
    nextRole: StudyGroupRole | null,
    actor: TenantActor,
  ): Promise<void> {
    if (targetRole !== StudyGroupRole.OWNER) {
      return;
    }
    const ownerCount = await this.repository.countOwners(group.id, group.tenantId);
    if (
      wouldLeaveGroupWithoutOwner({
        targetRole,
        nextRole,
        ownerCount,
        actorIsTenantAdmin: actor.isTenantAdmin,
      })
    ) {
      throw new BadRequestException(
        'A group needs at least one owner. Ask an organization admin to assign another owner first.',
      );
    }
  }

  private async weeklyRanks(
    groupIds: string[],
    actor: TenantActor,
    now: Date,
  ): Promise<Map<string, number>> {
    const ranks = new Map<string, number>();
    if (groupIds.length === 0) {
      return ranks;
    }
    const membersByGroup = await this.repository.listMemberIdsByGroup(groupIds, actor.tenantId);
    const allMembers = [...new Set([...membersByGroup.values()].flat())];
    const totals = await this.repository.pointTotals(allMembers, {
      from: periodStart('weekly', now),
      to: null,
    });
    for (const [groupId, memberIds] of membersByGroup) {
      const ranked = rankMembers(
        memberIds.map((userId) => ({ userId, displayName: userId, publicHandle: null })),
        totals,
        actor.userId,
      );
      const viewer = ranked.find((entry) => entry.isViewer);
      if (viewer) {
        ranks.set(groupId, viewer.rank);
      }
    }
    return ranks;
  }

  private async buildGoalViews(
    goals: GoalRecord[],
    members: MemberRecord[],
    viewerId: string,
    now: Date,
  ): Promise<StudyGroupGoalView[]> {
    const memberIds = members.map((member) => member.userId);
    const progressMembers = members.map((member) => ({
      userId: member.userId,
      displayName: buildDisplayName(member.firstName, member.lastName),
    }));
    const totals = await Promise.all(
      goals.map((goal) => this.repository.metricTotals(memberIds, goal.metric, goalWindow(goal))),
    );
    return goals.map((goal, index) => ({
      id: goal.id,
      title: goal.title,
      metric: goal.metric,
      scope: goal.scope,
      target: goal.target,
      startsAt: goal.startsAt,
      endsAt: goal.endsAt,
      completedAt: goal.completedAt,
      status: goalStatus(goal, now),
      progress: computeGoalProgress(goal, progressMembers, totals[index] ?? new Map(), viewerId),
    }));
  }

  private announceAdded(
    group: StudyGroupRecord,
    userIds: readonly string[],
    actor: TenantActor,
    now: Date,
  ): void {
    const day = now.toISOString().slice(0, 10);
    for (const recipientId of userIds) {
      if (recipientId === actor.userId) {
        continue;
      }
      const event: StudyGroupAddedEvent = {
        recipientId,
        groupId: group.id,
        groupName: group.name,
        actorName: actor.displayName,
        dedupeKey: `group-added:${group.id}:${recipientId}:${day}`,
      };
      this.eventEmitter.emit(NOTIFICATION_EVENTS.STUDY_GROUP_ADDED, event);
    }
  }

  private async mapNameConflict<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof StudyGroupNameTakenError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}

function requireTenant(actor: StudyGroupActor): TenantActor {
  if (!hasTenant(actor)) {
    throw new ForbiddenException(NO_ORGANIZATION_MESSAGE);
  }
  return actor;
}

function unwrap<T>(result: RuleResult<T>): T {
  if (!result.ok) {
    throw new BadRequestException(result.message);
  }
  return result.value;
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => id.length > 0))];
}

function selectVisibleGoals(goals: GoalRecord[], now: Date): GoalRecord[] {
  const open = goals.filter((goal) => goal.completedAt === null && goal.endsAt > now);
  const finished = goals
    .filter((goal) => goal.completedAt !== null || goal.endsAt <= now)
    .sort((left, right) => right.endsAt.getTime() - left.endsAt.getTime())
    .slice(0, FINISHED_GOALS_SHOWN);
  return [...open, ...finished];
}

function toMemberView(member: MemberRecord, viewerId: string): StudyGroupMemberView {
  return {
    userId: member.userId,
    displayName: buildDisplayName(member.firstName, member.lastName),
    headline: member.headline,
    publicHandle: member.publicHandle,
    role: member.role,
    joinedAt: member.joinedAt,
    isViewer: member.userId === viewerId,
  };
}

export function toActivityView(record: ActivityRecord): StudyGroupActivityView {
  return {
    id: record.id,
    userId: record.userId,
    displayName: buildDisplayName(record.firstName, record.lastName),
    publicHandle: record.publicHandle,
    kind: record.kind,
    title: record.title,
    linkUrl: record.linkUrl,
    points: record.points,
    occurredAt: record.occurredAt,
  };
}
