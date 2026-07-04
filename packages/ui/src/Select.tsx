import * as React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({ value, options, onChange, label, disabled, className = '' }: SelectProps) {
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
    <div className="flex w-full flex-col gap-2">
      {label && (
        <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
          {label}
        </span>
      )}
      <div ref={containerRef} className={`relative ${className}`}>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg) px-3 text-sm font-medium text-(--color-text-primary) transition focus:border-(--color-accent) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:bg-(--color-badge-bg) disabled:text-(--color-text-disabled)"
        >
          <span className="truncate">{selected?.label ?? 'Select'}</span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={`h-4 w-4 shrink-0 text-(--color-text-muted) transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              d="M6 8l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && !disabled && (
          <div
            role="listbox"
            className="absolute left-0 z-30 mt-1.5 w-full rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) py-1 shadow-(--shadow-popover)"
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
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-(--color-badge-bg) ${
                    active ? 'font-semibold text-(--color-accent)' : 'text-(--color-text-primary)'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && (
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
                      <path
                        d="M5 10.5l3 3 7-7"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
