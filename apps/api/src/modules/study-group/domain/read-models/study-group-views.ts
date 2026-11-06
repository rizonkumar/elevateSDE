import {
  StudyGoalMetric,
  StudyGoalScope,
  StudyGroupJoinPolicy,
  StudyGroupRole,
} from '@prisma/client';
import { GoalProgress, GoalStatus } from '../goal-progress';
import { LeaderboardWindow, RankedMember } from '../group-leaderboard';
import { GroupAccess } from '../policies/study-group-access';
import { ActivityKind } from './study-group-records';

export interface StudyGroupSummaryView {
  id: string;
  name: string;
  description: string | null;
  joinPolicy: StudyGroupJoinPolicy;
  memberCount: number;
  activeGoalCount: number;
  myRole: StudyGroupRole | null;
  myWeeklyRank: number | null;
  createdAt: Date;
}

export interface StudyGroupListView {
  canCreate: boolean;
  groups: StudyGroupSummaryView[];
  discoverable: StudyGroupSummaryView[];
}

export interface StudyGroupMemberView {
  userId: string;
  displayName: string;
  headline: string | null;
  publicHandle: string | null;
  role: StudyGroupRole;
  joinedAt: Date;
  isViewer: boolean;
}

export interface StudyGroupGoalView {
  id: string;
  title: string;
  metric: StudyGoalMetric;
  scope: StudyGoalScope;
  target: number;
  startsAt: Date;
  endsAt: Date;
  completedAt: Date | null;
  status: GoalStatus;
  progress: GoalProgress;
}

export interface StudyGroupDetailView {
  id: string;
  name: string;
  description: string | null;
  joinPolicy: StudyGroupJoinPolicy;
  memberCount: number;
  createdAt: Date;
  access: GroupAccess;
  members: StudyGroupMemberView[];
  goals: StudyGroupGoalView[];
}

export interface StudyGroupLeaderboardView {
  window: LeaderboardWindow;
  from: Date | null;
  to: Date | null;
  goalTitle: string | null;
  entries: RankedMember[];
}

export interface StudyGroupActivityView {
  id: string;
  userId: string;
  displayName: string;
  publicHandle: string | null;
  kind: ActivityKind;
  title: string;
  linkUrl: string | null;
  points: number;
  occurredAt: Date;
}

export interface RosterCandidateView {
  userId: string;
  displayName: string;
  email: string;
  headline: string | null;
}
