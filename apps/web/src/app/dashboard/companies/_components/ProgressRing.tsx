interface ProgressRingProps {
  solved: number;
  total: number;
  className?: string;
}

const VIEWBOX = 52;
const STROKE = 5;
const RADIUS = (VIEWBOX - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({
  solved,
  total,
  className = 'h-13 w-13',
}: Readonly<ProgressRingProps>) {
  const ratio = total > 0 ? Math.min(solved / total, 1) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className={`relative shrink-0 ${className}`} role="img" aria-label={`${percent}% solved`}>
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} aria-hidden="true" className="h-full w-full -rotate-90">
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-(--color-badge-bg)"
        />
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
          className="stroke-(--color-accent) transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-(--color-text-primary)">
        {percent}%
      </span>
    </div>
  );
}
