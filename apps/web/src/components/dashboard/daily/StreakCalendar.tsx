import * as React from 'react';
import type { StreakCalendarCellDto } from '@elevatesde/shared-types';

interface StreakCalendarProps {
  cells: StreakCalendarCellDto[];
}

function formatLabel(cell: StreakCalendarCellDto): string {
  return `${cell.date} — ${cell.completed ? 'solved' : 'no activity'}`;
}

export function StreakCalendar({ cells }: StreakCalendarProps) {
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ width: 'max-content' }}>
        {cells.map((cell) => (
          <span
            key={cell.date}
            title={formatLabel(cell)}
            className={`h-3 w-3 rounded-[3px] ${
              cell.completed ? 'bg-(--color-accent)' : 'bg-(--color-badge-bg)'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
