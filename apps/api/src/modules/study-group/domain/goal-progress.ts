import { PointSource, StudyGoalMetric, StudyGoalScope } from '@prisma/client';
import { GoalRecord, GoalWindow } from './read-models/study-group-records';

export type GoalStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ENDED';

export interface ProgressMember {
  userId: string;
  displayName: string;
}

export interface MemberGoalValue {
  userId: string;
  displayName: string;
  value: number;
  reached: boolean;
}

export type GoalProgress =
  | { scope: 'GROUP_TOTAL'; current: number; target: number; percent: number }
  | {
      scope: 'EACH_MEMBER';
      target: number;
      membersReached: number;
      memberCount: number;
      percent: number;
      viewerValue: number | null;
      perMember: MemberGoalValue[];
    };

type GoalTiming = Pick<GoalRecord, 'startsAt' | 'endsAt' | 'completedAt'>;

export function goalStatus(goal: GoalTiming, now: Date): GoalStatus {
  if (goal.completedAt !== null) {
    return 'COMPLETED';
  }
  if (now.getTime() < goal.startsAt.getTime()) {
    return 'UPCOMING';
  }
  if (now.getTime() >= goal.endsAt.getTime()) {
    return 'ENDED';
  }
  return 'ACTIVE';
}

export function isGoalInProgress(goal: GoalTiming, now: Date): boolean {
  return goalStatus(goal, now) === 'ACTIVE';
}

export function goalWindow(goal: Pick<GoalRecord, 'startsAt' | 'endsAt'>): GoalWindow {
  return { from: goal.startsAt, to: goal.endsAt };
}

export function percentOf(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.floor((value / total) * 100));
}

export function computeGoalProgress(
  goal: Pick<GoalRecord, 'scope' | 'target'>,
  members: readonly ProgressMember[],
  values: ReadonlyMap<string, number>,
  viewerId: string,
): GoalProgress {
  if (goal.scope === StudyGoalScope.GROUP_TOTAL) {
    const current = members.reduce((sum, member) => sum + (values.get(member.userId) ?? 0), 0);
    return {
      scope: 'GROUP_TOTAL',
      current,
      target: goal.target,
      percent: percentOf(current, goal.target),
    };
  }
  const perMember = members
    .map((member) => {
      const value = values.get(member.userId) ?? 0;
      return {
        userId: member.userId,
        displayName: member.displayName,
        value,
        reached: value >= goal.target,
      };
    })
    .sort(
      (left, right) =>
        right.value - left.value || left.displayName.localeCompare(right.displayName),
    );
  const membersReached = perMember.filter((member) => member.reached).length;
  const viewer = perMember.find((member) => member.userId === viewerId);
  return {
    scope: 'EACH_MEMBER',
    target: goal.target,
    membersReached,
    memberCount: perMember.length,
    percent: percentOf(membersReached, perMember.length),
    viewerValue: viewer ? viewer.value : null,
    perMember,
  };
}

export function isGoalReached(progress: GoalProgress): boolean {
  if (progress.scope === 'GROUP_TOTAL') {
    return progress.current >= progress.target;
  }
  return progress.memberCount > 0 && progress.membersReached === progress.memberCount;
}

const METRICS_BY_SOURCE: Record<PointSource, readonly StudyGoalMetric[]> = {
  PROBLEM_SOLVED: [StudyGoalMetric.PROBLEMS_SOLVED, StudyGoalMetric.POINTS],
  DAILY_CHALLENGE: [StudyGoalMetric.DAILY_CHALLENGES, StudyGoalMetric.POINTS],
  CONTEST_RESULT: [StudyGoalMetric.CONTESTS_ENTERED, StudyGoalMetric.POINTS],
  ADMIN_ADJUSTMENT: [],
};

export function metricsAffectedBy(source: PointSource): readonly StudyGoalMetric[] {
  return METRICS_BY_SOURCE[source];
}

export const LEDGER_SOURCE_FOR_COUNT_METRIC: Partial<Record<StudyGoalMetric, PointSource>> = {
  PROBLEMS_SOLVED: PointSource.PROBLEM_SOLVED,
  DAILY_CHALLENGES: PointSource.DAILY_CHALLENGE,
};

export const EARNING_SOURCES: readonly PointSource[] = [
  PointSource.PROBLEM_SOLVED,
  PointSource.DAILY_CHALLENGE,
  PointSource.CONTEST_RESULT,
];
