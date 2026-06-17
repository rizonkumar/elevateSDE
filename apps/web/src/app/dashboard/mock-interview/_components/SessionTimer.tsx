'use client';

import { Clock } from 'lucide-react';

interface SessionTimerProps {
  readonly remainingSeconds: number;
}

function format(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function SessionTimer({ remainingSeconds }: SessionTimerProps) {
  const isLow = remainingSeconds <= 60;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-(--radius-full) border px-3.5 py-1.5 text-sm font-semibold tabular-nums transition-colors ${
        isLow
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300'
          : 'border-(--color-border-subtle) bg-(--color-bg-soft) text-(--color-text-primary)'
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      {format(remainingSeconds)}
    </div>
  );
}
