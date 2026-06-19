'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle2, ArrowUpRight, RotateCcw } from 'lucide-react';
import { Badge, Button } from '@elevatesde/ui';
import type { BadgeVariant } from '@elevatesde/ui';
import type {
  InterviewCompetencySeverity,
  MockInterviewFeedback,
} from '@elevatesde/shared-types';
import { scoreBand } from '@/lib/resume-analyzer';
import { useMockInterviewStore } from '@/store/mock-interview.store';

interface FeedbackReportProps {
  readonly feedback: MockInterviewFeedback;
}

const SEVERITY_VARIANT: Record<InterviewCompetencySeverity, BadgeVariant> = {
  good: 'success',
  warning: 'warning',
  critical: 'danger',
};

export function FeedbackReport({ feedback }: FeedbackReportProps) {
  const reset = useMockInterviewStore((state) => state.reset);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const band = scoreBand(feedback.overallScore);
  const gaugeData = [{ name: 'score', value: feedback.overallScore }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col gap-6"
    >
      <div className="card flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative h-40 w-40 shrink-0">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="78%"
                outerRadius="100%"
                data={gaugeData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background={{ fill: 'var(--color-badge-bg)' }}
                  dataKey="value"
                  cornerRadius={20}
                  angleAxisId={0}
                  fill={band.fill}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-4xl font-semibold leading-none text-(--color-text-primary)">
              {feedback.overallScore}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
              Overall
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <h2 className="m-0 font-display text-xl font-semibold tracking-tight text-(--color-text-primary)">
              Interview feedback
            </h2>
            <Badge variant={band.badgeVariant}>{band.label}</Badge>
          </div>
          <p className="m-0 text-sm leading-relaxed text-(--color-text-muted)">{feedback.summary}</p>
          <Button className="mt-1 self-center sm:self-start" onClick={reset}>
            <span className="inline-flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Start new interview
            </span>
          </Button>
        </div>
      </div>

      <div className="card flex flex-col gap-4">
        <h3 className="m-0 text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
          Competency breakdown
        </h3>
        <div className="flex flex-col gap-4">
          {feedback.competencies.map((competency) => (
            <div key={competency.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-(--color-text-primary)">
                  {competency.label}
                </span>
                <Badge variant={SEVERITY_VARIANT[competency.severity]}>{competency.score}</Badge>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-(--radius-full) bg-(--color-badge-bg)">
                <div
                  className="h-full rounded-(--radius-full) bg-(--color-accent)"
                  style={{ width: `${competency.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card flex flex-col gap-3">
          <h3 className="m-0 text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Strengths
          </h3>
          <ul className="m-0 flex flex-col gap-3 p-0">
            {feedback.strengths.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-(--color-success)" />
                <span className="text-sm leading-relaxed text-(--color-text-primary)">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card flex flex-col gap-3">
          <h3 className="m-0 text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Where to improve
          </h3>
          <ul className="m-0 flex flex-col gap-3 p-0">
            {feedback.improvements.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)" />
                <span className="text-sm leading-relaxed text-(--color-text-primary)">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
