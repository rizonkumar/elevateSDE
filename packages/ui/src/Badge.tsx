import * as React from 'react';

export type BadgeVariant = 'neutral' | 'accent' | 'warning' | 'danger' | 'success';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    'bg-[var(--color-badge-bg)] text-[var(--color-text-primary)] border-[var(--color-border-subtle)]',
  accent: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
};

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
