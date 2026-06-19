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
          <label className="text-[13px] font-medium text-(--color-text-primary) select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3 text-(--color-text-muted) pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full h-10 ${
              icon ? 'pl-10 pr-3' : 'px-3'
            } bg-(--color-bg) border border-(--color-border) rounded-(--radius-sm) text-sm text-(--color-text-primary) placeholder-(--color-text-disabled) transition-all focus:outline-none focus:border-(--color-accent) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] disabled:bg-(--color-badge-bg) disabled:text-(--color-text-disabled) disabled:cursor-not-allowed ${
              error ? 'border-(--color-danger) focus:border-(--color-danger) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-danger)]' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-(--color-danger) mt-0.5">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
