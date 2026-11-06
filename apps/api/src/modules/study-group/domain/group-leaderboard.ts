import { periodStart } from '../../leaderboard/domain/point-periods';
import { GoalRecord, MemberPointTotals } from './read-models/study-group-records';

export type LeaderboardWindow = 'goal' | 'week' | 'all';

export interface ResolvedWindow {
  window: LeaderboardWindow;
  from: Date | null;
  to: Date | null;
  goalTitle: string | null;
}

export interface RankableMember {
  userId: string;
  displayName: string;
  publicHandle: string | null;
}

export interface RankedMember extends RankableMember {
  rank: number;
  points: number;
  problemsSolved: number;
  isViewer: boolean;
}

type WindowGoal = Pick<GoalRecord, 'title' | 'startsAt' | 'endsAt'>;

export function resolveLeaderboardWindow(
  window: LeaderboardWindow,
  goals: readonly WindowGoal[],
  now: Date,
): ResolvedWindow {
  if (window === 'all') {
    return { window: 'all', from: null, to: null, goalTitle: null };
  }
  if (window === 'goal') {
    const running = goals
      .filter((goal) => goal.startsAt.getTime() <= now.getTime() && goal.endsAt > now)
      .sort((left, right) => left.endsAt.getTime() - right.endsAt.getTime());
    const goal = running[0];
    if (goal) {
      return { window: 'goal', from: goal.startsAt, to: goal.endsAt, goalTitle: goal.title };
    }
  }
  return { window: 'week', from: periodStart('weekly', now), to: null, goalTitle: null };
}

export function rankMembers(
  members: readonly RankableMember[],
  totals: ReadonlyMap<string, MemberPointTotals>,
  viewerId: string,
): RankedMember[] {
  const scored = members
    .map((member) => {
      const total = totals.get(member.userId);
      return {
        ...member,
        points: total?.points ?? 0,
        problemsSolved: total?.problemsSolved ?? 0,
        isViewer: member.userId === viewerId,
      };
    })
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.problemsSolved - left.problemsSolved ||
        left.displayName.localeCompare(right.displayName),
    );
  const ranked: RankedMember[] = [];
  scored.forEach((member, index) => {
    const previous = ranked[index - 1];
    const tied =
      previous?.points === member.points &&
      previous.problemsSolved === member.problemsSolved;
    ranked.push({ ...member, rank: tied ? previous.rank : index + 1 });
  });
  return ranked;
}
