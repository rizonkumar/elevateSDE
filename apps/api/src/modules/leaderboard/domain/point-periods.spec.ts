import { periodStart } from './point-periods';

describe('periodStart', () => {
  it.each([
    ['2026-10-05T00:00:00.000Z', '2026-10-05T00:00:00.000Z'],
    ['2026-10-07T18:45:00.000Z', '2026-10-05T00:00:00.000Z'],
    ['2026-10-11T23:59:59.999Z', '2026-10-05T00:00:00.000Z'],
    ['2026-10-01T03:00:00.000Z', '2026-09-28T00:00:00.000Z'],
  ])('starts the week containing %s on Monday %s', (now, expected) => {
    expect(periodStart('weekly', new Date(now))).toEqual(new Date(expected));
  });

  it.each([
    ['2026-10-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'],
    ['2026-10-31T23:59:59.999Z', '2026-10-01T00:00:00.000Z'],
    ['2027-01-15T12:00:00.000Z', '2027-01-01T00:00:00.000Z'],
  ])('starts the month containing %s on %s', (now, expected) => {
    expect(periodStart('monthly', new Date(now))).toEqual(new Date(expected));
  });
});
