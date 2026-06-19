import * as React from 'react';

interface PageHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ kicker, title, description, actions, className = '' }: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}
    >
      <div className="min-w-0">
        {kicker && (
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent)">
            {kicker}
          </div>
        )}
        <h1 className="m-0 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 mb-0 max-w-2xl text-sm text-(--color-text-muted)">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 self-start sm:self-end">{actions}</div>}
    </div>
  );
}
