'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  disabled?: boolean;
  withTime?: boolean;
  placeholder?: string;
}

interface PopoverCoords {
  top: number;
  left: number;
  width: number;
  placement: 'top' | 'bottom';
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const POPOVER_WIDTH = 288;

function parseValue(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DatePicker({
  value,
  onChange,
  label,
  disabled,
  withTime = false,
  placeholder = 'Select date',
}: DatePickerProps) {
  const selected = parseValue(value);
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<PopoverCoords | null>(null);
  const [view, setView] = React.useState<Date>(() => selected ?? new Date());
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const estimatedHeight = withTime ? 392 : 332;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'top' | 'bottom' =
      spaceBelow < estimatedHeight && rect.top > estimatedHeight ? 'top' : 'bottom';
    const width = Math.max(rect.width, POPOVER_WIDTH);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const top = placement === 'bottom' ? rect.bottom + 6 : rect.top - 6;
    setCoords({ top, left, width, placement });
  }, [withTime]);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleReposition = () => updatePosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
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

  const year = view.getFullYear();
  const month = view.getMonth();
  const leading = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: Array<number | null> = [];
  for (let i = 0; i < leading; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  const emit = (next: Date) => onChange(next.toISOString());

  const toggle = () => {
    if (disabled) return;
    setOpen((prev) => {
      const next = !prev;
      if (next && selected) setView(selected);
      return next;
    });
  };

  const selectDay = (day: number) => {
    const hours = selected ? selected.getHours() : withTime ? 9 : 0;
    const minutes = selected ? selected.getMinutes() : 0;
    emit(new Date(year, month, day, hours, minutes, 0, 0));
    if (!withTime) setOpen(false);
  };

  const changeTime = (next: string) => {
    const parts = next.split(':');
    const hours = Number(parts[0] ?? 0);
    const minutes = Number(parts[1] ?? 0);
    const base = selected ?? new Date(year, month, today.getDate());
    emit(new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0, 0));
  };

  const display = (() => {
    if (!selected) return placeholder;
    const datePart = selected.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    if (!withTime) return datePart;
    return `${datePart}, ${pad(selected.getHours())}:${pad(selected.getMinutes())}`;
  })();

  const timeValue = selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : '';

  const popover = coords && (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        transform: coords.placement === 'top' ? 'translateY(-100%)' : undefined,
      }}
      className="z-[60] rounded-lg border border-(--color-border-subtle) bg-(--color-surface) p-3 shadow-(--shadow-soft)"
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="rounded-md p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-(--color-text-primary)">
          {view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="rounded-md p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="flex h-7 items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-(--color-text-muted)"
          >
            {weekday}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} className="h-8" />;
          const dayDate = new Date(year, month, day);
          const isSelected = selected !== null && isSameDay(dayDate, selected);
          const isToday = isSameDay(dayDate, today);
          let dayClass =
            'flex h-8 items-center justify-center rounded-md text-sm transition-colors cursor-pointer ';
          if (isSelected) {
            dayClass += 'bg-(--color-accent) font-semibold text-white';
          } else if (isToday) {
            dayClass += 'border border-(--color-accent) text-(--color-accent) hover:bg-(--color-accent-soft)';
          } else {
            dayClass += 'text-(--color-text-primary) hover:bg-(--color-badge-bg)';
          }
          return (
            <button key={day} type="button" onClick={() => selectDay(day)} className={dayClass}>
              {day}
            </button>
          );
        })}
      </div>

      {withTime && (
        <div className="mt-3 flex items-center gap-2 border-t border-(--color-border-subtle) pt-3">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-(--color-text-muted)">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="time"
            value={timeValue}
            onChange={(event) => changeTime(event.target.value)}
            className="flex-1 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) px-3 py-1.5 text-sm text-(--color-text-primary) focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/10"
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-(--color-border-subtle) pt-2">
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          className="rounded-md px-2 py-1 text-xs font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary) cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            emit(
              withTime ? now : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
            );
            setView(now);
            if (!withTime) setOpen(false);
          }}
          className="rounded-md px-2 py-1 text-xs font-semibold text-(--color-accent) transition-opacity hover:opacity-80 cursor-pointer"
        >
          Today
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <span className="ml-1 select-none text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-(--color-border-subtle) bg-(--color-bg-soft) px-3.5 py-2.5 text-sm font-medium text-(--color-text-primary) transition hover:border-(--color-text-muted) focus:border-(--color-accent) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        <span className={selected ? 'truncate' : 'truncate text-(--color-text-muted)'}>
          {display}
        </span>
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-(--color-text-muted)">
          <path
            d="M7 3v3m10-3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && !disabled && mounted && createPortal(popover, document.body)}
    </div>
  );
}
