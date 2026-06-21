'use client';

import * as React from 'react';
import { Mic2, Code2, Briefcase, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SectionShell } from './SectionShell';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { AppWindow } from './AppWindow';
import { ThemedShot } from './ThemedShot';

interface ShowcaseTab {
  id: string;
  label: string;
  icon: LucideIcon;
  shot: string;
  route: string;
  caption: string;
  alt: string;
}

const TABS: ShowcaseTab[] = [
  {
    id: 'interview',
    label: 'Mock Interview',
    icon: Mic2,
    shot: 'mock-interview',
    route: 'app.elevatesde.dev/mock-interview',
    caption: 'Configure topic, role level, and company style, then run a scored AI round.',
    alt: 'AI mock interview console with round configuration',
  },
  {
    id: 'editor',
    label: 'Code Editor',
    icon: Code2,
    shot: 'assessment',
    route: 'app.elevatesde.dev/assessment',
    caption: 'A full Monaco IDE with the problem, your solution, and live test results side by side.',
    alt: 'Coding assessment editor with problem statement and Monaco editor',
  },
  {
    id: 'tracker',
    label: 'Job Tracker',
    icon: Briefcase,
    shot: 'job-tracker',
    route: 'app.elevatesde.dev/job-tracker',
    caption: 'Drag applications across stages to keep your pipeline current.',
    alt: 'Job application tracker Kanban board',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    shot: 'leaderboard',
    route: 'app.elevatesde.dev/leaderboard',
    caption: 'See how your preparation stacks up against the community.',
    alt: 'Leaderboard with podium and ranked performers',
  },
];

export function ProductShowcase() {
  const [firstTab] = TABS;
  const [activeId, setActiveId] = React.useState(firstTab.id);
  const active = TABS.find((tab) => tab.id === activeId) ?? firstTab;

  return (
    <SectionShell id="product" bordered>
      <Reveal>
        <SectionHeading
          kicker="See it in action"
          title="A workspace built for deep practice"
          description="Real screenshots from the product. Switch between the surfaces engineers use every day to go from rusty to interview-ready."
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                aria-pressed={isActive}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-(--radius-full) border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)'
                    : 'border-(--color-border-subtle) bg-(--color-surface) text-(--color-text-muted) hover:text-(--color-text-primary)'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-6">
        <AppWindow label={active.route}>
          <div className="aspect-16/10 w-full sm:aspect-video">
            <ThemedShot
              key={active.shot}
              name={active.shot}
              alt={active.alt}
              width={1440}
              height={900}
              position="object-top"
            />
          </div>
        </AppWindow>
        <p className="mt-4 text-center font-mono text-xs uppercase tracking-widest text-(--color-text-muted)">
          {active.caption}
        </p>
      </Reveal>
    </SectionShell>
  );
}
