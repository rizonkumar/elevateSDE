'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function Select({ value, options, onChange, disabled, className = '' }: SelectProps) {
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

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 w-full min-w-[160px] text-xs font-semibold bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="truncate">{selected?.label ?? 'Select'}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !disabled && (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-1.5 w-full min-w-[160px] rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] py-1"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex items-center justify-between gap-2 w-full text-left text-xs px-3 py-2 transition-colors hover:bg-[var(--color-badge-bg)] cursor-pointer ${
                  active
                    ? 'text-[var(--color-accent)] font-semibold'
                    : 'text-[var(--color-text-primary)]'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
