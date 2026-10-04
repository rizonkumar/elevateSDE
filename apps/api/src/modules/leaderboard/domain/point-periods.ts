import { addDays } from '../../daily-challenge/domain/daily-date';

export type PointPeriod = 'weekly' | 'monthly';

const DAYS_PER_WEEK = 7;
const MONDAY_OFFSET = 6;

export function periodStart(period: PointPeriod, now: Date): Date {
  if (period === 'monthly') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  const daysSinceMonday = (now.getUTCDay() + MONDAY_OFFSET) % DAYS_PER_WEEK;
  return addDays(now, -daysSinceMonday);
}
