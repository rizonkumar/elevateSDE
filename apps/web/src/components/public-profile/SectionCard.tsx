import * as React from 'react';

interface SectionCardProps {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, aside, children, className = '' }: Readonly<SectionCardProps>) {
  return (
    <section
      className={`rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6 ${className}`.trim()}
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="m-0 font-display text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
          {title}
        </h2>
        {aside && <div className="text-xs text-(--color-text-muted)">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export function EmptyNote({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="m-0 rounded-md border border-dashed border-(--color-border) px-4 py-6 text-center text-sm text-(--color-text-muted)">
      {children}
    </p>
  );
}
