import { rankMembers, resolveLeaderboardWindow } from './group-leaderboard';

const NOW = new Date('2027-03-10T12:00:00.000Z');

describe('resolveLeaderboardWindow', () => {
  const goals = [
    {
      title: 'Long goal',
      startsAt: new Date('2027-03-01T00:00:00.000Z'),
      endsAt: new Date('2027-05-01T00:00:00.000Z'),
    },
    {
      title: 'Sprint',
      startsAt: new Date('2027-03-05T00:00:00.000Z'),
      endsAt: new Date('2027-03-20T00:00:00.000Z'),
    },
    {
      title: 'Future',
      startsAt: new Date('2027-04-01T00:00:00.000Z'),
      endsAt: new Date('2027-04-10T00:00:00.000Z'),
    },
  ];

  it('uses the running goal that ends first', () => {
    expect(resolveLeaderboardWindow('goal', goals, NOW)).toEqual({
      window: 'goal',
      from: new Date('2027-03-05T00:00:00.000Z'),
      to: new Date('2027-03-20T00:00:00.000Z'),
      goalTitle: 'Sprint',
    });
  });

  it('falls back to this week when no goal is running', () => {
    expect(resolveLeaderboardWindow('goal', [], NOW)).toEqual({
      window: 'week',
      from: new Date('2027-03-08T00:00:00.000Z'),
      to: null,
      goalTitle: null,
    });
  });

  it('has no bounds for all time', () => {
    expect(resolveLeaderboardWindow('all', goals, NOW)).toMatchObject({ from: null, to: null });
  });
});

describe('rankMembers', () => {
  const members = [
    { userId: 'a', displayName: 'Ada', publicHandle: null },
    { userId: 'b', displayName: 'Ben', publicHandle: 'ben' },
    { userId: 'c', displayName: 'Cy', publicHandle: null },
    { userId: 'd', displayName: 'Di', publicHandle: null },
  ];

  it('ranks by points, breaks ties by problems solved and shares full ties', () => {
    const ranked = rankMembers(
      members,
      new Map([
        ['a', { points: 50, problemsSolved: 2 }],
        ['b', { points: 50, problemsSolved: 4 }],
        ['c', { points: 20, problemsSolved: 1 }],
        ['d', { points: 20, problemsSolved: 1 }],
      ]),
      'c',
    );
    expect(ranked.map((entry) => [entry.userId, entry.rank])).toEqual([
      ['b', 1],
      ['a', 2],
      ['c', 3],
      ['d', 3],
    ]);
    expect(ranked.find((entry) => entry.isViewer)?.userId).toBe('c');
  });

  it('includes members with no points at the bottom', () => {
    const ranked = rankMembers(members, new Map([['d', { points: 5, problemsSolved: 0 }]]), 'a');
    expect(ranked[0]?.userId).toBe('d');
    expect(ranked.slice(1).every((entry) => entry.points === 0 && entry.rank === 2)).toBe(true);
  });
});
