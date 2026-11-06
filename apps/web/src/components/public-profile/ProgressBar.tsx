interface ProgressBarProps {
  value: number;
  max: number;
  toneClass: string;
  label: string;
}

export function ProgressBar({ value, max, toneClass, label }: Readonly<ProgressBarProps>) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-(--radius-full) bg-(--color-badge-bg)">
      <progress className="sr-only" aria-label={label} value={value} max={max > 0 ? max : 1} />
      <div
        aria-hidden="true"
        className={`h-full rounded-(--radius-full) ${toneClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
