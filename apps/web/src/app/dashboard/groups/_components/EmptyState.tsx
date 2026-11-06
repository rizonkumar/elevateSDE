import * as React from 'react';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: Readonly<EmptyStateProps>) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-md border border-dashed border-(--color-border) px-6 text-center ${
        compact ? 'py-10' : 'py-16'
      }`}
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="m-0 font-display text-lg font-semibold">{title}</h2>
      <p className="m-0 max-w-md text-sm text-(--color-text-muted)">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
