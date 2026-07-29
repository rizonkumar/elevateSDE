import { startOfUtcMonth, startOfUtcWeek } from './utc-period';

describe('startOfUtcWeek', () => {
  it('rolls a Sunday back to the preceding Monday', () => {
    expect(startOfUtcWeek(new Date('2026-08-02T23:59:59.999Z')).toISOString()).toBe(
      '2026-07-27T00:00:00.000Z',
    );
  });

  it('is idempotent on a Monday', () => {
    const monday = startOfUtcWeek(new Date('2026-07-27T00:00:00.000Z'));
    expect(startOfUtcWeek(monday).toISOString()).toBe('2026-07-27T00:00:00.000Z');
  });

  it('resolves mid-week to the same Monday', () => {
    expect(startOfUtcWeek(new Date('2026-07-29T12:00:00.000Z')).toISOString()).toBe(
      '2026-07-27T00:00:00.000Z',
    );
  });

  it('crosses a month boundary correctly', () => {
    expect(startOfUtcWeek(new Date('2026-09-02T06:00:00.000Z')).toISOString()).toBe(
      '2026-08-31T00:00:00.000Z',
    );
  });

  it('does not leak local time around a DST transition', () => {
    expect(startOfUtcWeek(new Date('2026-03-29T01:30:00.000Z')).toISOString()).toBe(
      '2026-03-23T00:00:00.000Z',
    );
  });
});

describe('startOfUtcMonth', () => {
  it('is idempotent on the first of the month', () => {
    expect(startOfUtcMonth(new Date('2026-07-01T00:00:00.000Z')).toISOString()).toBe(
      '2026-07-01T00:00:00.000Z',
    );
  });

  it('resolves the last day of a month to that month', () => {
    expect(startOfUtcMonth(new Date('2026-07-31T23:59:59.999Z')).toISOString()).toBe(
      '2026-07-01T00:00:00.000Z',
    );
  });
});
