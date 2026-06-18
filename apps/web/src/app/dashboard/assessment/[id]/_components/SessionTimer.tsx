'use client';

import { Clock } from 'lucide-react';

interface SessionTimerProps {
  remainingSeconds: number;
}

function format(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function SessionTimer({ remainingSeconds }: SessionTimerProps) {
  const danger = remainingSeconds > 0 && remainingSeconds <= 60;
  const expired = remainingSeconds === 0;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums transition-colors ${
        danger || expired
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300'
          : 'border-(--color-border-subtle) bg-(--color-bg-soft) text-(--color-text-primary)'
      }`}
      aria-live="polite"
    >
      <Clock className="h-4 w-4 shrink-0" />
      <span>{expired ? 'Time up' : format(remainingSeconds)}</span>
    </div>
  );
}
