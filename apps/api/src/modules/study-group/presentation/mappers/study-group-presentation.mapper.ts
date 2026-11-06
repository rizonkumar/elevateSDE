import type {
  StudyGoalProgressDto,
  StudyGroupActivityItemDto,
  StudyGroupDetailDto,
  StudyGroupGoalDto,
  StudyGroupLeaderboardDto,
  StudyGroupListDto,
  StudyGroupMemberDto,
  StudyGroupRosterCandidateDto,
  StudyGroupSummaryDto,
  StudyGroupViewerDto,
} from '@elevatesde/shared-types';
import { GoalProgress } from '../../domain/goal-progress';
import { GroupAccess } from '../../domain/policies/study-group-access';
import {
  RosterCandidateView,
  StudyGroupActivityView,
  StudyGroupDetailView,
  StudyGroupGoalView,
  StudyGroupLeaderboardView,
  StudyGroupListView,
  StudyGroupMemberView,
  StudyGroupSummaryView,
} from '../../domain/read-models/study-group-views';

export class StudyGroupPresentationMapper {
  static toList(view: StudyGroupListView): StudyGroupListDto {
    return {
      canCreate: view.canCreate,
      groups: view.groups.map(toSummary),
      discoverable: view.discoverable.map(toSummary),
    };
  }

  static toDetail(view: StudyGroupDetailView): StudyGroupDetailDto {
    return {
      id: view.id,
      name: view.name,
      description: view.description,
      joinPolicy: view.joinPolicy,
      memberCount: view.memberCount,
      createdAt: view.createdAt.toISOString(),
      viewer: toViewer(view.access),
      members: view.members.map(toMember),
      goals: view.goals.map(toGoal),
    };
  }

  static toLeaderboard(view: StudyGroupLeaderboardView): StudyGroupLeaderboardDto {
    return {
      window: view.window,
      from: view.from ? view.from.toISOString() : null,
      to: view.to ? view.to.toISOString() : null,
      goalTitle: view.goalTitle,
      entries: view.entries.map((entry) => ({
        rank: entry.rank,
        userId: entry.userId,
        displayName: entry.displayName,
        publicHandle: entry.publicHandle,
        points: entry.points,
        problemsSolved: entry.problemsSolved,
        isViewer: entry.isViewer,
      })),
    };
  }

  static toActivity(view: StudyGroupActivityView): StudyGroupActivityItemDto {
    return {
      id: view.id,
      userId: view.userId,
      displayName: view.displayName,
      publicHandle: view.publicHandle,
      kind: view.kind,
      title: view.title,
      linkUrl: view.linkUrl,
      points: view.points,
      occurredAt: view.occurredAt.toISOString(),
    };
  }

  static toRosterCandidate(view: RosterCandidateView): StudyGroupRosterCandidateDto {
    return {
      userId: view.userId,
      displayName: view.displayName,
      email: view.email,
      headline: view.headline,
    };
  }
}

function toSummary(view: StudyGroupSummaryView): StudyGroupSummaryDto {
  return {
    id: view.id,
    name: view.name,
    description: view.description,
    joinPolicy: view.joinPolicy,
    memberCount: view.memberCount,
    activeGoalCount: view.activeGoalCount,
    myRole: view.myRole,
    myWeeklyRank: view.myWeeklyRank,
    createdAt: view.createdAt.toISOString(),
  };
}

function toViewer(access: GroupAccess): StudyGroupViewerDto {
  return {
    role: access.role,
    isMember: access.isMember,
    isTenantAdmin: access.isTenantAdmin,
    canEdit: access.canEdit,
    canArchive: access.canArchive,
    canManageMembers: access.canManageMembers,
    canAssignRoles: access.canAssignRoles,
    canManageGoals: access.canManageGoals,
    canJoin: access.canJoin,
    canLeave: access.canLeave,
  };
}

function toMember(view: StudyGroupMemberView): StudyGroupMemberDto {
  return {
    userId: view.userId,
    displayName: view.displayName,
    headline: view.headline,
    publicHandle: view.publicHandle,
    role: view.role,
    joinedAt: view.joinedAt.toISOString(),
    isViewer: view.isViewer,
  };
}

function toGoal(view: StudyGroupGoalView): StudyGroupGoalDto {
  return {
    id: view.id,
    title: view.title,
    metric: view.metric,
    scope: view.scope,
    target: view.target,
    startsAt: view.startsAt.toISOString(),
    endsAt: view.endsAt.toISOString(),
    completedAt: view.completedAt ? view.completedAt.toISOString() : null,
    status: view.status,
    progress: toProgress(view.progress),
  };
}

function toProgress(progress: GoalProgress): StudyGoalProgressDto {
  if (progress.scope === 'GROUP_TOTAL') {
    return { ...progress };
  }
  return { ...progress, perMember: progress.perMember.map((member) => ({ ...member })) };
}
