'use client';

import * as React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { scoreBand } from '@/lib/resume-analyzer';

interface AtsScoreGaugeProps {
  score: number;
}

export function AtsScoreGauge({ score }: AtsScoreGaugeProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const band = scoreBand(score);
  const data = [{ name: 'ats', value: score }];

  return (
    <div className="relative h-44 w-44 shrink-0 sm:h-48 sm:w-48">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="78%"
            outerRadius="100%"
            data={data}
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
        <div className="font-display text-5xl font-bold leading-none text-(--color-text-primary)">
          {score}
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
          ATS Score
        </div>
      </div>
    </div>
  );
}
