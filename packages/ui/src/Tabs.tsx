import * as React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className = '' }: TabsProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-(--radius-lg) bg-(--color-tab-bg) p-1 ${className}`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-[calc(var(--radius-lg)-0.25rem)] px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)/30 ${
              active
                ? 'bg-(--color-tab-active) text-(--color-text-primary) shadow-(--shadow-soft)'
                : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
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
