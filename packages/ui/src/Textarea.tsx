import * as React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-2">
        {label && (
          <label className="text-[13px] font-medium text-(--color-text-primary) select-none">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`min-h-[88px] w-full resize-y rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-sm text-(--color-text-primary) placeholder-(--color-text-disabled) transition-all focus:border-(--color-accent) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:bg-(--color-badge-bg) disabled:text-(--color-text-disabled) ${
            error
              ? 'border-(--color-danger) focus:border-(--color-danger) focus:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-danger)]'
              : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="mt-0.5 text-xs text-(--color-danger)">{error}</span>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
