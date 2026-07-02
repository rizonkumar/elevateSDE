import * as React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export type TabsVariant = 'pill' | 'plain';

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  variant?: TabsVariant;
  className?: string;
}

export function Tabs({ items, value, onChange, variant = 'pill', className = '' }: TabsProps) {
  const isPlain = variant === 'plain';

  return (
    <div
      role="tablist"
      className={`inline-flex items-center ${
        isPlain ? 'gap-1' : 'gap-1 rounded-(--radius-md) bg-(--color-tab-bg) p-1'
      } ${className}`.trim()}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === value;
        const activeClasses = isPlain
          ? 'text-(--color-text-primary) font-semibold border-b-2 border-(--color-accent)'
          : 'bg-(--color-tab-active) text-(--color-text-primary) shadow-(--shadow-card)';
        const inactiveClasses = isPlain
          ? 'text-(--color-text-muted) font-medium border-b-2 border-transparent hover:text-(--color-text-primary)'
          : 'text-(--color-text-muted) font-medium hover:text-(--color-text-primary)';
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 text-sm transition-colors cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] ${
              isPlain ? 'rounded-none px-2.5 py-2 -mb-px' : 'rounded-(--radius-sm) px-3 py-1.5'
            } ${active ? activeClasses : inactiveClasses}`}
          >
            {Icon && (
              <Icon
                className={`w-4 h-4 shrink-0 ${isPlain && active ? 'text-(--color-accent)' : ''}`}
              />
            )}
            <span className="whitespace-nowrap">{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                  active
                    ? 'bg-(--color-accent-soft) text-(--color-accent)'
                    : 'bg-(--color-badge-bg) text-(--color-text-muted)'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
