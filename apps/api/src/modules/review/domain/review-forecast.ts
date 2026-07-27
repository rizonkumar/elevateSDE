import { addDays, startOfUtcDay, toDateKey } from '../../daily-challenge/domain/daily-date';
import { ReviewForecastDayView } from './read-models/review-item-view';

export function buildForecast(dueAts: Date[], from: Date, days: number): ReviewForecastDayView[] {
  const start = startOfUtcDay(from);
  const end = addDays(start, days);

  const counts = new Map<string, number>();
  for (const dueAt of dueAts) {
    if (dueAt >= end) {
      continue;
    }
    const key = toDateKey(dueAt < start ? start : dueAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const forecast: ReviewForecastDayView[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = toDateKey(addDays(start, offset));
    forecast.push({ date, count: counts.get(date) ?? 0 });
  }
  return forecast;
}
