import * as React from 'react';
import type { SubmissionHeatmapCellDto } from '@elevatesde/shared-types';

interface ContributionHeatmapProps {
  cells: SubmissionHeatmapCellDto[];
}

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 364;

function toKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function levelClass(count: number): string {
  if (count <= 0) return 'bg-(--color-badge-bg)';
  if (count <= 2) return 'bg-(--color-accent)/30';
  if (count <= 5) return 'bg-(--color-accent)/60';
  return 'bg-(--color-accent)';
}

export function ContributionHeatmap({ cells }: ContributionHeatmapProps) {
  const counts = new Map(cells.map((cell) => [cell.date, cell.count]));
  const total = cells.reduce((sum, cell) => sum + cell.count, 0);

  const today = new Date();
  const start = new Date(today.getTime() - WINDOW_DAYS * DAY_MS);
  start.setDate(start.getDate() - start.getDay());

  const days: { key: string; count: number }[] = [];
  for (let time = start.getTime(); time <= today.getTime(); time += DAY_MS) {
    const key = toKey(new Date(time));
    days.push({ key, count: counts.get(key) ?? 0 });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-(--color-text-muted)">
        <span className="font-semibold text-(--color-text-primary)">{total}</span> submissions in the
        past year
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ width: 'max-content' }}>
          {days.map((day) => (
            <span
              key={day.key}
              title={`${day.key} — ${day.count} submission${day.count === 1 ? '' : 's'}`}
              className={`h-3 w-3 rounded-[3px] ${levelClass(day.count)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
