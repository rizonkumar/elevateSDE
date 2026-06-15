import * as React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] select-none ml-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3.5 text-[var(--color-text-muted)] pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full ${
              icon ? 'pl-10 pr-3.5' : 'px-3.5'
            } py-2.5 bg-[var(--color-bg-soft)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] shadow-xs transition-all focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/10 ${
              error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/10' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-500 mt-0.5 ml-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
