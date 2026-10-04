export type PointPeriod = 'weekly' | 'monthly';

const DAYS_PER_WEEK = 7;
const MONDAY_OFFSET = 6;

export function periodStart(period: PointPeriod, now: Date): Date {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  if (period === 'monthly') {
    return new Date(Date.UTC(year, month, 1));
  }
  const daysSinceMonday = (now.getUTCDay() + MONDAY_OFFSET) % DAYS_PER_WEEK;
  return new Date(Date.UTC(year, month, now.getUTCDate() - daysSinceMonday));
}
