import * as React from 'react';

interface ShellNavGroupProps {
  label?: string;
  rail: boolean;
  isFirst: boolean;
  children: React.ReactNode;
}

export function ShellNavGroup({ label, rail, isFirst, children }: ShellNavGroupProps) {
  const generatedId = React.useId();
  const headingId = label ? generatedId : undefined;
  const spacing = isFirst ? '' : rail ? 'mt-3' : 'mt-6';

  return (
    <div role="group" aria-labelledby={headingId} className={spacing}>
      {label &&
        (rail ? (
          <>
            <span id={headingId} className="sr-only">
              {label}
            </span>
            <div aria-hidden="true" className="mx-auto mb-3 h-px w-6 bg-(--color-border-subtle)" />
          </>
        ) : (
          <div
            id={headingId}
            className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-(--color-text-disabled)"
          >
            {label}
          </div>
        ))}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
