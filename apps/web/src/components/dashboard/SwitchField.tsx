'use client';

import * as React from 'react';

interface SwitchFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

export function SwitchField({ label, description, checked, disabled, onChange }: Readonly<SwitchFieldProps>) {
  const labelId = React.useId();
  const descriptionId = React.useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div id={labelId} className="text-sm font-medium text-(--color-text-primary)">
          {label}
        </div>
        {description && (
          <p id={descriptionId} className="mt-0.5 mb-0 text-xs text-(--color-text-muted)">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-(--radius-full) transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-(--color-accent)' : 'bg-(--color-border)'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-(--radius-full) bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
