import { Mic2, FileText, Briefcase, Building2, Sparkles, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  meta: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Mic2,
    title: 'Adaptive AI Mock Interviews',
    meta: 'Real-time',
    body: 'Answer by voice or text. The engine scores your response and raises domain-specific follow-ups in real time.',
  },
  {
    icon: FileText,
    title: 'Resume Analyzer',
    meta: 'ATS',
    body: 'Upload a resume to get an ATS score, parsed skills, and a prioritized list of targeted edits.',
  },
  {
    icon: Briefcase,
    title: 'Job Application Tracker',
    meta: 'Kanban',
    body: 'Track every application across stages with an organized board, from applied to offer.',
  },
  {
    icon: Building2,
    title: 'Enterprise Multi-Tenancy',
    meta: 'B2B ready',
    body: 'Register corporate domains, grant isolated workspaces, and manage team progress and seats.',
  },
  {
    icon: Sparkles,
    title: 'AI Evaluation Engine',
    meta: 'pgvector',
    body: 'Vector similarity and LangChain orchestration produce accurate, contextual feedback at scale.',
  },
  {
    icon: CreditCard,
    title: 'Billing & Subscriptions',
    meta: 'Stripe',
    body: 'Multi-tenant billing with Stripe subscriptions and webhooks, built in from day one.',
  },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-2xl font-bold tracking-tight text-(--color-text-primary) sm:text-3xl">
          Everything you need to get hired
        </h2>
        <p className="mt-2 text-sm text-(--color-text-muted) sm:text-base">
          A complete, enterprise-grade toolkit for interview preparation — from practice to offer.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-soft) transition-colors hover:border-(--color-accent)"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-(--color-text-muted)">
                  {feature.meta}
                </span>
              </div>
              <h3 className="text-base font-semibold text-(--color-text-primary)">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-(--color-text-muted)">{feature.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
