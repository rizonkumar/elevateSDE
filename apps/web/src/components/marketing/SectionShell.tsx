import type { ReactNode } from 'react';

interface SectionShellProps {
  id?: string;
  children: ReactNode;
  bordered?: boolean;
  className?: string;
}

export function SectionShell({ id, children, bordered = false, className = '' }: SectionShellProps) {
  return (
    <section
      id={id}
      className={`${bordered ? 'border-t border-(--color-border-subtle)' : ''} scroll-mt-20`}
    >
      <div className={`mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 ${className}`}>
        {children}
      </div>
    </section>
  );
}
