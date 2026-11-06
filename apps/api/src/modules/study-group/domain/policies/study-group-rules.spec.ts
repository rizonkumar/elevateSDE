import { StudyGoalMetric, StudyGoalScope, StudyGroupJoinPolicy } from '@prisma/client';
import {
  exceedsGoalLimit,
  exceedsMemberLimit,
  normalizeGoalDraft,
  normalizeGroupDraft,
} from './study-group-rules';

const goal = {
  title: '  Solve   100 problems ',
  metric: StudyGoalMetric.PROBLEMS_SOLVED,
  scope: StudyGoalScope.GROUP_TOTAL,
  target: 100,
  startsAt: new Date('2027-03-01T00:00:00.000Z'),
  endsAt: new Date('2027-04-01T00:00:00.000Z'),
};

describe('normalizeGroupDraft', () => {
  it('trims the name and turns a blank description into null', () => {
    expect(
      normalizeGroupDraft({
        name: '  Spring   cohort ',
        description: '   ',
        joinPolicy: StudyGroupJoinPolicy.OPEN,
      }),
    ).toEqual({
      ok: true,
      value: { name: 'Spring cohort', description: null, joinPolicy: StudyGroupJoinPolicy.OPEN },
    });
  });

  it('rejects a blank or too long name and a too long description', () => {
    const base = { joinPolicy: StudyGroupJoinPolicy.OPEN };
    expect(normalizeGroupDraft({ ...base, name: '   ' }).ok).toBe(false);
    expect(normalizeGroupDraft({ ...base, name: 'x'.repeat(61) }).ok).toBe(false);
    expect(normalizeGroupDraft({ ...base, name: 'ok', description: 'x'.repeat(281) }).ok).toBe(
      false,
    );
  });
});

describe('normalizeGoalDraft', () => {
  it('accepts a valid goal and tidies the title', () => {
    const result = normalizeGoalDraft(goal);
    expect(result.ok && result.value.title).toBe('Solve 100 problems');
  });

  it.each([
    ['a zero target', { target: 0 }],
    ['a fractional target', { target: 1.5 }],
    ['an end before the start', { endsAt: new Date('2027-02-01T00:00:00.000Z') }],
    ['an end equal to the start', { endsAt: goal.startsAt }],
    ['an invalid date', { startsAt: new Date('nope') }],
    ['a blank title', { title: '  ' }],
  ])('rejects %s', (_label, overrides) => {
    expect(normalizeGoalDraft({ ...goal, ...overrides }).ok).toBe(false);
  });
});

describe('limits', () => {
  it('caps groups at 200 members', () => {
    expect(exceedsMemberLimit(199, 1)).toBe(false);
    expect(exceedsMemberLimit(199, 2)).toBe(true);
  });

  it('caps groups at 5 active goals', () => {
    expect(exceedsGoalLimit(4)).toBe(false);
    expect(exceedsGoalLimit(5)).toBe(true);
  });
});
