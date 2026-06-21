import type { ReactNode } from 'react';

interface AppWindowProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export function AppWindow({
  children,
  label = 'app.elevatesde.dev',
  className = '',
}: Readonly<AppWindowProps>) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-soft) ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-(--color-border-subtle) bg-(--color-bg-soft) px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-(--color-border)" />
          <span className="h-2.5 w-2.5 rounded-full bg-(--color-border)" />
          <span className="h-2.5 w-2.5 rounded-full bg-(--color-border)" />
        </div>
        <div className="mx-auto flex max-w-xs flex-1 items-center justify-center rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-surface) px-3 py-1">
          <span className="truncate font-mono text-[11px] text-(--color-text-muted)">{label}</span>
        </div>
        <div className="h-2.5 w-2.5" />
      </div>
      <div className="bg-(--color-bg)">{children}</div>
    </div>
  );
}
