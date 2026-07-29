const DAYS_PER_WEEK = 7;

export function startOfUtcWeek(date: Date): Date {
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = (dayOfWeek + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysSinceMonday),
  );
}

export function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
