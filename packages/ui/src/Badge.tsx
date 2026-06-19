import * as React from 'react';

export type BadgeVariant = 'neutral' | 'accent' | 'warning' | 'danger' | 'success';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-(--color-badge-bg) text-(--color-text-muted) border-(--color-border-subtle)',
  accent: 'bg-(--color-accent-soft) text-(--color-accent) border-transparent',
  warning: 'bg-(--color-warning-soft) text-(--color-warning) border-transparent',
  danger: 'bg-(--color-danger-soft) text-(--color-danger) border-transparent',
  success: 'bg-(--color-success-soft) text-(--color-success) border-transparent',
};

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-(--radius-full) border text-[11px] font-medium tracking-normal whitespace-nowrap ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
