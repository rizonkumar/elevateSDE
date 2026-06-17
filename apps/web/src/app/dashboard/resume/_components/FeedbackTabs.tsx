'use client';

import * as React from 'react';
import {
  Sparkles,
  ListChecks,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Badge, Tabs, type TabItem } from '@elevatesde/ui';
import type {
  ResumeDto,
  ResumeFeedbackItem,
  ResumeFeedbackSeverity,
} from '@elevatesde/shared-types';

interface FeedbackTabsProps {
  readonly analysis: ResumeDto;
}

type TabId = 'skills' | 'structure' | 'tips';

const severityIcon: Record<ResumeFeedbackSeverity, typeof CheckCircle2> = {
  good: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
};

const severityColor: Record<ResumeFeedbackSeverity, string> = {
  good: 'text-emerald-500',
  warning: 'text-amber-500',
  critical: 'text-rose-500',
};

function FeedbackRow({ item }: { readonly item: ResumeFeedbackItem }) {
  const Icon = severityIcon[item.severity];
  return (
    <li className="flex items-start gap-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${severityColor[item.severity]}`} />
      <div className="min-w-0">
        <p className="mb-0.5 text-sm font-semibold text-(--color-text-primary)">{item.title}</p>
        <p className="mb-0 text-xs leading-relaxed text-(--color-text-muted)">{item.detail}</p>
      </div>
    </li>
  );
}

export function FeedbackTabs({ analysis }: FeedbackTabsProps) {
  const [tab, setTab] = React.useState<TabId>('skills');

  const items: TabItem[] = [
    { id: 'skills', label: 'Skills Match', icon: Sparkles, count: analysis.parsedSkills.length },
    {
      id: 'structure',
      label: 'Structure',
      icon: ListChecks,
      count: analysis.structureFeedback.length,
    },
    { id: 'tips', label: 'Tips', icon: Lightbulb, count: analysis.actionableTips.length },
  ];

  return (
    <div className="card flex flex-col gap-5">
      <div className="overflow-x-auto">
        <Tabs items={items} value={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      {tab === 'skills' && (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
              Matched skills
            </h3>
            {analysis.parsedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.parsedSkills.map((skill) => (
                  <Badge key={skill} variant="success">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mb-0 text-sm text-(--color-text-muted)">
                No recognized engineering skills were detected.
              </p>
            )}
          </div>
          {analysis.missingSkills.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
                Recommended to add
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((skill) => (
                  <Badge key={skill} variant="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'structure' && (
        <ul className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
          {analysis.structureFeedback.map((item) => (
            <FeedbackRow key={item.title} item={item} />
          ))}
        </ul>
      )}

      {tab === 'tips' && (
        <ol className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
          {analysis.actionableTips.map((tip, index) => (
            <li key={tip} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-[11px] font-bold text-(--color-accent)">
                {index + 1}
              </span>
              <p className="mb-0 text-sm leading-relaxed text-(--color-text-primary)">{tip}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
