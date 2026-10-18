'use client';

import * as React from 'react';

interface ShellTooltipProps {
  label: string;
  enabled: boolean;
  children: React.ReactNode;
}

export function ShellTooltip({ label, enabled, children }: ShellTooltipProps) {
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [top, setTop] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!enabled) setTop(null);
  }, [enabled]);

  if (!enabled) return <>{children}</>;

  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setTop(rect.top + rect.height / 2);
  };
  const hide = () => setTop(null);

  return (
    <div ref={anchorRef} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {top !== null && (
        <span
          role="tooltip"
          style={{ top }}
          className="pointer-events-none fixed left-[72px] z-50 -translate-y-1/2 whitespace-nowrap rounded-(--radius-sm) bg-(--color-text-primary) px-2 py-1 text-xs font-medium text-(--color-bg) shadow-(--shadow-popover)"
        >
          {label}
        </span>
      )}
    </div>
  );
}
