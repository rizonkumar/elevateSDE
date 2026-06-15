'use client';

import * as React from 'react';

interface RangeSliderProps {
  value: number;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export function RangeSlider({
  value,
  onChange,
  onCommit,
  disabled,
  min = 0,
  max = 100,
  className = '',
}: RangeSliderProps) {
  const [local, setLocal] = React.useState(value);

  React.useEffect(() => {
    setLocal(value);
  }, [value]);

  const pct = Math.min(100, Math.max(0, ((local - min) / (max - min)) * 100));

  return (
    <div className={`relative h-4 flex items-center ${className}`}>
      <div className="relative w-full h-1.5 rounded-full bg-[var(--color-badge-bg)]">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-accent)]"
          style={{ width: `${pct}%` }}
        />
        <span
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white border-2 border-[var(--color-accent)] shadow-sm pointer-events-none ${
            disabled ? 'opacity-50' : ''
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={local}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          setLocal(next);
          onChange?.(next);
        }}
        onMouseUp={(event) => onCommit?.(Number((event.target as HTMLInputElement).value))}
        onTouchEnd={(event) => onCommit?.(Number((event.target as HTMLInputElement).value))}
        onKeyUp={(event) => onCommit?.(Number((event.target as HTMLInputElement).value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Rollout percentage"
      />
    </div>
  );
}
