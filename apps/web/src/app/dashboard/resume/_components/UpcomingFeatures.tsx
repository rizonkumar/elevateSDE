'use client';

import * as React from 'react';
import { Bot, Target, TrendingUp, FileDown } from 'lucide-react';

interface RoadmapItem {
  icon: typeof Bot;
  title: string;
  detail: string;
}

const ROADMAP: RoadmapItem[] = [
  {
    icon: Bot,
    title: 'AI deep analysis',
    detail: 'Gemini-powered rewrites and a section-by-section critique of every bullet.',
  },
  {
    icon: Target,
    title: 'Target a job',
    detail: 'Paste a job description to get tailored keyword matching and gap analysis.',
  },
  {
    icon: TrendingUp,
    title: 'History & trends',
    detail: 'Securely save resumes and track how your ATS score improves over time.',
  },
  {
    icon: FileDown,
    title: 'Shareable report',
    detail: 'Export a polished PDF of your analysis to share with mentors or peers.',
  },
];

export function UpcomingFeatures() {
  return (
    <section className="mt-12 border-t border-(--color-border-subtle) pt-10">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent)">
          On the roadmap
        </div>
        <p className="mb-0 mt-1 text-sm text-(--color-text-muted)">
          What we&apos;re building next for the resume analyzer.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROADMAP.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="card relative flex flex-col gap-3">
              <span className="absolute right-3 top-3 rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-badge-bg) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-(--color-text-muted)">
                Soon
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-(--radius-lg) bg-(--color-accent-soft) text-(--color-accent)">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-(--color-text-primary)">
                  {item.title}
                </h3>
                <p className="mb-0 text-xs leading-relaxed text-(--color-text-muted)">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
