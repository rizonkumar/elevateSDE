import * as React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-2">
        {label && (
          <label className="text-[13px] font-medium text-(--color-text-primary) select-none">
            {label}
          </label>
        )}
        <div className="relative flex w-full items-center">
          {icon && (
            <div className="pointer-events-none absolute left-3 flex items-center justify-center text-(--color-text-muted)">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`h-10 w-full ${
              icon ? 'pr-3 pl-10' : 'px-3'
            } rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg) text-sm text-(--color-text-primary) placeholder-(--color-text-disabled) transition-all focus:border-(--color-accent) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:bg-(--color-badge-bg) disabled:text-(--color-text-disabled) ${
              error
                ? 'border-(--color-danger) focus:border-(--color-danger) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-danger)]'
                : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="mt-0.5 text-xs text-(--color-danger)">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
