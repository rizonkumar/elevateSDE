import * as React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-[13px] font-medium text-(--color-text-primary) select-none">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2.5 bg-(--color-bg) border border-(--color-border) rounded-(--radius-sm) text-sm text-(--color-text-primary) placeholder-(--color-text-disabled) transition-all resize-y min-h-[88px] focus:outline-none focus:border-(--color-accent) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] disabled:bg-(--color-badge-bg) disabled:text-(--color-text-disabled) disabled:cursor-not-allowed ${
            error ? 'border-(--color-danger) focus:border-(--color-danger) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-danger)]' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-(--color-danger) mt-0.5">{error}</span>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
