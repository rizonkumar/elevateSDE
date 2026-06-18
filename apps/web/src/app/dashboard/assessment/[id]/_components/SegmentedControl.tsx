'use client';

interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: Readonly<SegmentedControlProps<T>>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-lg border border-(--color-border-subtle) bg-(--color-badge-bg) p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors cursor-pointer ${
              active
                ? 'bg-(--color-surface) text-(--color-text-primary) shadow-(--shadow-soft)'
                : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
