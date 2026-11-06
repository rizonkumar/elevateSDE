interface ProgressBarProps {
  value: number;
  max: number;
  toneClass: string;
  label: string;
}

export function ProgressBar({ value, max, toneClass, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-1.5 w-full overflow-hidden rounded-(--radius-full) bg-(--color-badge-bg)"
    >
      <div
        className={`h-full rounded-(--radius-full) ${toneClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
