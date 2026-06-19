import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-(--color-text-primary) text-(--color-bg) hover:opacity-90 shadow-xs',
  secondary:
    'bg-(--color-bg) text-(--color-text-primary) border border-(--color-border) hover:bg-(--color-badge-bg)',
  tertiary: 'bg-transparent text-(--color-text-primary) hover:bg-(--color-badge-bg)',
  danger: 'bg-(--color-danger) text-white hover:opacity-90 shadow-xs',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const baseStyle =
    'inline-flex h-10 items-center justify-center gap-2 rounded-(--radius-sm) px-3 text-sm font-medium transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60';
  return <button className={`${baseStyle} ${variantClasses[variant]} ${className}`} {...props} />;
}
