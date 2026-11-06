import { PointSource, StudyGoalMetric, StudyGoalScope } from '@prisma/client';
import {
  computeGoalProgress,
  goalStatus,
  isGoalReached,
  metricsAffectedBy,
  percentOf,
} from './goal-progress';

const members = [
  { userId: 'a', displayName: 'Ada' },
  { userId: 'b', displayName: 'Ben' },
  { userId: 'c', displayName: 'Cy' },
];

describe('computeGoalProgress', () => {
  it('sums every member for a group total goal and caps the percent', () => {
    const values = new Map([
      ['a', 4],
      ['b', 3],
    ]);
    const progress = computeGoalProgress(
      { scope: StudyGoalScope.GROUP_TOTAL, target: 10 },
      members,
      values,
      'a',
    );
    expect(progress).toEqual({ scope: 'GROUP_TOTAL', current: 7, target: 10, percent: 70 });
    expect(isGoalReached(progress)).toBe(false);

    const over = computeGoalProgress(
      { scope: StudyGoalScope.GROUP_TOTAL, target: 5 },
      members,
      values,
      'a',
    );
    expect(over.percent).toBe(100);
    expect(isGoalReached(over)).toBe(true);
  });

  it('counts the members who reached an each-member goal', () => {
    const progress = computeGoalProgress(
      { scope: StudyGoalScope.EACH_MEMBER, target: 3 },
      members,
      new Map([
        ['a', 3],
        ['b', 5],
        ['c', 1],
      ]),
      'c',
    );
    expect(progress).toMatchObject({
      scope: 'EACH_MEMBER',
      membersReached: 2,
      memberCount: 3,
      percent: 66,
      viewerValue: 1,
    });
    expect(progress.scope === 'EACH_MEMBER' && progress.perMember.map((m) => m.userId)).toEqual([
      'b',
      'a',
      'c',
    ]);
    expect(isGoalReached(progress)).toBe(false);
  });

  it('reports a null viewer value for non-members and 0% for empty groups', () => {
    const progress = computeGoalProgress(
      { scope: StudyGoalScope.EACH_MEMBER, target: 1 },
      [],
      new Map(),
      'x',
    );
    expect(progress).toMatchObject({ viewerValue: null, percent: 0, memberCount: 0 });
    expect(isGoalReached(progress)).toBe(false);
  });
});

describe('goalStatus', () => {
  const goal = {
    startsAt: new Date('2027-03-01T00:00:00.000Z'),
    endsAt: new Date('2027-04-01T00:00:00.000Z'),
    completedAt: null,
  };

  it('moves from upcoming to active to ended', () => {
    expect(goalStatus(goal, new Date('2027-02-01T00:00:00.000Z'))).toBe('UPCOMING');
    expect(goalStatus(goal, new Date('2027-03-15T00:00:00.000Z'))).toBe('ACTIVE');
    expect(goalStatus(goal, new Date('2027-04-01T00:00:00.000Z'))).toBe('ENDED');
  });

  it('prefers completed over everything', () => {
    expect(goalStatus({ ...goal, completedAt: new Date() }, new Date('2027-02-01'))).toBe(
      'COMPLETED',
    );
  });
});

describe('metricsAffectedBy', () => {
  it('maps ledger sources to the goal metrics they move', () => {
    expect(metricsAffectedBy(PointSource.PROBLEM_SOLVED)).toEqual([
      StudyGoalMetric.PROBLEMS_SOLVED,
      StudyGoalMetric.POINTS,
    ]);
    expect(metricsAffectedBy(PointSource.CONTEST_RESULT)).toContain(
      StudyGoalMetric.CONTESTS_ENTERED,
    );
    expect(metricsAffectedBy(PointSource.ADMIN_ADJUSTMENT)).toEqual([]);
  });
});

describe('percentOf', () => {
  it('floors and guards against a zero total', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(1, 0)).toBe(0);
  });
});
