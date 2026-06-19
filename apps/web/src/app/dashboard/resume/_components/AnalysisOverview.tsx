'use client';

import { Sparkles, PlusCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { ResumeDto } from '@elevatesde/shared-types';
import { scoreBand } from '@/lib/resume-analyzer';
import { AtsScoreGauge } from './AtsScoreGauge';
import { ResumeDropzone } from './ResumeDropzone';

interface AnalysisOverviewProps {
  analysis: ResumeDto;
  isAnalyzing: boolean;
  onFile: (file: File) => void;
}

interface Stat {
  label: string;
  value: number;
  icon: typeof Sparkles;
  tone: string;
}

export function AnalysisOverview({ analysis, isAnalyzing, onFile }: AnalysisOverviewProps) {
  const score = analysis.atsScore ?? 0;
  const band = scoreBand(score);
  const needsWork = analysis.structureFeedback.filter((item) => item.severity !== 'good').length;
  const strengths = analysis.structureFeedback.filter((item) => item.severity === 'good').length;

  const stats: Stat[] = [
    {
      label: 'Skills matched',
      value: analysis.parsedSkills.length,
      icon: Sparkles,
      tone: 'text-(--color-accent)',
    },
    {
      label: 'To add',
      value: analysis.missingSkills.length,
      icon: PlusCircle,
      tone: 'text-(--color-text-muted)',
    },
    { label: 'Strengths', value: strengths, icon: CheckCircle2, tone: 'text-(--color-success)' },
    { label: 'To fix', value: needsWork, icon: AlertTriangle, tone: 'text-(--color-warning)' },
  ];

  return (
    <div className="card flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
      <div className="flex justify-center lg:block">
        <AtsScoreGauge score={score} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={band.badgeVariant}>{band.label}</Badge>
            <span className="text-xs text-(--color-text-muted)">Applicant tracking readiness</span>
          </div>
          <p className="mb-0 text-base font-medium leading-relaxed text-(--color-text-primary)">
            {analysis.summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col gap-1 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-badge-bg) px-3.5 py-3"
              >
                <Icon className={`h-4 w-4 ${stat.tone}`} />
                <span className="font-display text-2xl font-semibold leading-none text-(--color-text-primary)">
                  {stat.value}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-(--color-text-muted)">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>

        <ResumeDropzone
          variant="compact"
          onFile={onFile}
          isAnalyzing={isAnalyzing}
          fileName={analysis.fileName}
        />
      </div>
    </div>
  );
}
