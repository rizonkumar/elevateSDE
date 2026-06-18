'use client';

import * as React from 'react';
import { Clock, Play, Pause, RotateCcw, Minus, Plus } from 'lucide-react';
import { useAssessmentStore } from '@/store/assessment.store';

function format(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function TimerControl() {
  const timerMode = useAssessmentStore((state) => state.timerMode);
  const timerStatus = useAssessmentStore((state) => state.timerStatus);
  const elapsedSeconds = useAssessmentStore((state) => state.elapsedSeconds);
  const remainingSeconds = useAssessmentStore((state) => state.remainingSeconds);
  const countdownMinutes = useAssessmentStore((state) => state.countdownMinutes);
  const startTimer = useAssessmentStore((state) => state.startTimer);
  const pauseTimer = useAssessmentStore((state) => state.pauseTimer);
  const resumeTimer = useAssessmentStore((state) => state.resumeTimer);
  const resetTimer = useAssessmentStore((state) => state.resetTimer);
  const setTimerMode = useAssessmentStore((state) => state.setTimerMode);
  const setCountdownMinutes = useAssessmentStore((state) => state.setCountdownMinutes);

  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const displaySeconds = timerMode === 'stopwatch' ? elapsedSeconds : remainingSeconds;
  const danger = timerMode === 'countdown' && timerStatus !== 'idle' && remainingSeconds <= 60;
  const running = timerStatus === 'running';

  const togglePlay = () => {
    if (running) {
      pauseTimer();
    } else if (timerStatus === 'paused') {
      resumeTimer();
    } else {
      startTimer();
    }
  };

  let actionLabel = 'Start';
  if (running) {
    actionLabel = 'Pause';
  } else if (timerStatus === 'paused') {
    actionLabel = 'Resume';
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`inline-flex items-center gap-1.5 rounded-lg border px-1.5 py-1 transition-colors ${
          danger
            ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300'
            : 'border-(--color-border-subtle) bg-(--color-bg-soft) text-(--color-text-primary)'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Timer settings"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-semibold tabular-nums hover:bg-(--color-badge-bg) cursor-pointer"
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span>{format(displaySeconds)}</span>
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={running ? 'Pause timer' : 'Start timer'}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--color-text-primary) hover:bg-(--color-badge-bg) cursor-pointer"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-lg border border-(--color-border-subtle) bg-(--color-surface) p-4 shadow-(--shadow-soft)">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-(--color-tab-bg) p-1">
            {(['stopwatch', 'countdown'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTimerMode(mode)}
                className={`rounded-[calc(var(--radius-lg)-0.25rem)] px-3 py-1.5 text-sm font-medium capitalize transition-colors cursor-pointer ${
                  timerMode === mode
                    ? 'bg-(--color-tab-active) text-(--color-text-primary) shadow-(--shadow-soft)'
                    : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="my-4 text-center font-display text-4xl font-bold tabular-nums tracking-tight text-(--color-text-primary)">
            {format(displaySeconds)}
          </div>

          {timerMode === 'countdown' && (
            <div className="mb-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCountdownMinutes(countdownMinutes - 5)}
                aria-label="Decrease minutes"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--color-border-subtle) text-(--color-text-primary) hover:bg-(--color-badge-bg) cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-20 text-center text-sm font-medium text-(--color-text-muted)">
                {countdownMinutes} min
              </span>
              <button
                type="button"
                onClick={() => setCountdownMinutes(countdownMinutes + 5)}
                aria-label="Increase minutes"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--color-border-subtle) text-(--color-text-primary) hover:bg-(--color-badge-bg) cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-(--color-text-primary) px-4 py-2 text-sm font-semibold text-(--color-bg) transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {actionLabel}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              aria-label="Reset timer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-(--color-border-subtle) px-4 py-2 text-sm font-semibold text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
