interface OptionCardItem<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface OptionCardsProps<T extends string> {
  label: string;
  value: T;
  options: OptionCardItem<T>[];
  onChange: (value: T) => void;
}

export function OptionCards<T extends string>({
  label,
  value,
  options,
  onChange,
}: Readonly<OptionCardsProps<T>>) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 text-[13px] font-medium text-(--color-text-primary)">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`flex cursor-pointer flex-col gap-1 rounded-(--radius-sm) border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] ${
                active
                  ? 'border-(--color-accent) bg-(--color-accent-soft)'
                  : 'border-(--color-border) bg-(--color-bg) hover:bg-(--color-badge-bg)'
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  active ? 'text-(--color-accent)' : 'text-(--color-text-primary)'
                }`}
              >
                {option.label}
              </span>
              <span className="text-xs text-(--color-text-muted)">{option.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
