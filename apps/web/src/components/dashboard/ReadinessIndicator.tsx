import type { InterviewReadinessStatus } from '@elevatesde/shared-types';

interface ReadinessIndicatorProps {
  score: number | null;
  status: InterviewReadinessStatus;
  confidence: number;
  size?: 'sm' | 'lg';
}

const STATUS_LABELS: Record<InterviewReadinessStatus, string> = {
  INSUFFICIENT_EVIDENCE: 'Insufficient evidence',
  NEEDS_WORK: 'Needs work',
  PROGRESSING: 'Progressing',
  READY: 'Ready',
};

export function ReadinessIndicator({
  score,
  status,
  confidence,
  size = 'sm',
}: ReadinessIndicatorProps) {
  const diameter = size === 'lg' ? 120 : 72;
  const stroke = size === 'lg' ? 9 : 6;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score === null ? 0 : score / 100;
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: diameter, height: diameter }}>
        <svg viewBox={`0 0 ${diameter} ${diameter}`} className="-rotate-90" aria-hidden="true">
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border-subtle)"
            strokeWidth={stroke}
          />
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-semibold text-(--color-text-primary)">
          {score === null ? '—' : Math.round(score)}
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-(--color-text-primary)">{STATUS_LABELS[status]}</div>
        <div className="mt-1 text-xs text-(--color-text-muted)">
          {Math.round(confidence * 100)}% evidence confidence
        </div>
      </div>
    </div>
  );
}
