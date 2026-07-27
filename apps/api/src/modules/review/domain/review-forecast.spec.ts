import { addDays, toDateKey } from '../../daily-challenge/domain/daily-date';
import { buildForecast } from './review-forecast';

const FROM = new Date('2026-07-25T09:30:00.000Z');

describe('buildForecast', () => {
  it('emits one zeroed entry per day when nothing is scheduled', () => {
    const forecast = buildForecast([], FROM, 7);

    expect(forecast).toHaveLength(7);
    expect(forecast.every((day) => day.count === 0)).toBe(true);
    expect(forecast[0]?.date).toBe('2026-07-25');
    expect(forecast[6]?.date).toBe('2026-07-31');
  });

  it('groups items that fall on the same day', () => {
    const dueAt = addDays(FROM, 3);

    const forecast = buildForecast([dueAt, dueAt, dueAt], FROM, 7);

    expect(forecast[3]).toEqual({ date: toDateKey(dueAt), count: 3 });
    expect(forecast.reduce((total, day) => total + day.count, 0)).toBe(3);
  });

  it('folds overdue items into the first day', () => {
    const forecast = buildForecast([addDays(FROM, -5), addDays(FROM, -1), FROM], FROM, 7);

    expect(forecast[0]?.count).toBe(3);
    expect(forecast.reduce((total, day) => total + day.count, 0)).toBe(3);
  });

  it('ignores items scheduled at or beyond the horizon', () => {
    const forecast = buildForecast([addDays(FROM, 7), addDays(FROM, 40)], FROM, 7);

    expect(forecast.reduce((total, day) => total + day.count, 0)).toBe(0);
  });
});
