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

export function Select({
  value,
  options,
  onChange,
  label,
  disabled,
  className = '',
}: SelectProps) {
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
    <div className="flex flex-col gap-2 w-full">
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
          className="flex h-10 items-center justify-between gap-2 w-full text-sm font-medium bg-(--color-bg) border border-(--color-border) rounded-(--radius-sm) px-3 text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] transition disabled:bg-(--color-badge-bg) disabled:text-(--color-text-disabled) disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="truncate">{selected?.label ?? 'Select'}</span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={`w-4 h-4 shrink-0 text-(--color-text-muted) transition-transform ${open ? 'rotate-180' : ''}`}
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
            className="absolute left-0 z-30 mt-1.5 w-full rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-popover) py-1"
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
                  className={`flex items-center justify-between gap-2 w-full text-left text-sm px-3.5 py-2 transition-colors hover:bg-(--color-badge-bg) cursor-pointer ${
                    active
                      ? 'text-(--color-accent) font-semibold'
                      : 'text-(--color-text-primary)'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && (
                    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0">
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
