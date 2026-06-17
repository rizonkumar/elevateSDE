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
          <label className="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted) select-none ml-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3.5 py-2.5 bg-(--color-bg-soft) border border-(--color-border-subtle) rounded-(--radius-lg) text-sm text-(--color-text-primary) placeholder-(--color-text-muted) shadow-xs transition-all resize-y min-h-[88px] focus:outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/10 ${
            error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/10' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500 mt-0.5 ml-1">{error}</span>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
