'use client';

import * as React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface RadialProgressProps {
  value: number;
  primary: string;
  secondary?: string;
  color?: string;
}

export function RadialProgress({
  value,
  primary,
  secondary,
  color = 'var(--color-accent)',
}: Readonly<RadialProgressProps>) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const clamped = Math.max(0, Math.min(100, value));
  const data = [{ name: 'progress', value: clamped }];

  return (
    <div className="relative h-36 w-36 shrink-0 sm:h-40 sm:w-40">
      {mounted && (
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="80%"
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
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      )}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-2xl font-semibold leading-none text-(--color-text-primary)">
          {primary}
        </div>
        {secondary && (
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-text-muted)">
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
}
