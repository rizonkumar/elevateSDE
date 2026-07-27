import * as React from 'react';
import type { ReviewForecastDayDto } from '@elevatesde/shared-types';

interface ReviewForecastProps {
  days: ReviewForecastDayDto[];
}

const TRACK_HEIGHT_PX = 96;
const MIN_BAR_HEIGHT_PX = 3;

function formatDayLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function barClass(count: number, isToday: boolean): string {
  if (count === 0) {
    return 'bg-(--color-badge-bg)';
  }
  return isToday ? 'bg-(--color-accent)' : 'bg-(--color-accent)/55';
}

export function ReviewForecast({ days }: Readonly<ReviewForecastProps>) {
  const peak = days.reduce((highest, day) => Math.max(highest, day.count), 0);
  const total = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-(--color-text-muted)">
        <span className="font-semibold text-(--color-text-primary)">{total}</span> review
        {total === 1 ? '' : 's'} scheduled over the next {days.length} days
      </div>
      <div className="overflow-x-auto">
        <div className="flex items-end gap-1" style={{ height: `${TRACK_HEIGHT_PX}px` }}>
          {days.map((day, index) => {
            const height =
              peak > 0 && day.count > 0
                ? Math.max(MIN_BAR_HEIGHT_PX, Math.round((day.count / peak) * TRACK_HEIGHT_PX))
                : MIN_BAR_HEIGHT_PX;
            const label = formatDayLabel(day.date);
            return (
              <span
                key={day.date}
                title={`${label} — ${day.count} review${day.count === 1 ? '' : 's'}`}
                className={`w-3 shrink-0 rounded-[3px] ${barClass(day.count, index === 0)}`}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>
      </div>
      {days.length > 0 && (
        <div className="flex items-center justify-between text-xs text-(--color-text-muted)">
          <span>{formatDayLabel(days[0]?.date ?? '')}</span>
          <span>{formatDayLabel(days.at(-1)?.date ?? '')}</span>
        </div>
      )}
    </div>
  );
}
