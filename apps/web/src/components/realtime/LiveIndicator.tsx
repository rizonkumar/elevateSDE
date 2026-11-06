interface LiveIndicatorProps {
  live: boolean;
  fallbackLabel: string;
}

export function LiveIndicator({ live, fallbackLabel }: Readonly<LiveIndicatorProps>) {
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1.5 rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-surface) px-2.5 py-0.5 text-xs font-medium text-(--color-text-muted)"
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-(--radius-full) ${
          live
            ? 'animate-pulse bg-(--color-success) motion-reduce:animate-none'
            : 'bg-(--color-text-disabled)'
        }`}
      />
      {live ? 'Live' : fallbackLabel}
    </span>
  );
}
