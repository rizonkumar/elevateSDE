'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { SectionShell } from './SectionShell';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

type Cadence = 'monthly' | 'quarterly' | 'yearly';

const CADENCES: { id: Cadence; label: string; discount: number; badge: string | null }[] = [
  { id: 'monthly', label: 'Monthly', discount: 0, badge: null },
  { id: 'quarterly', label: 'Quarterly', discount: 0.1, badge: '-10%' },
  { id: 'yearly', label: 'Yearly', discount: 0.2, badge: '-20%' },
];

interface Tier {
  name: string;
  blurb: string;
  monthly: number;
  unit: string;
  featured: boolean;
  cta: string;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    blurb: 'For individual engineers getting started.',
    monthly: 0,
    unit: 'forever',
    featured: false,
    cta: 'Start free',
    features: [
      'Coding assessments from the full bank',
      'Resume ATS analysis',
      'Job tracker, forum, and leaderboard',
      'Limited AI mock interviews',
    ],
  },
  {
    name: 'Pro',
    blurb: 'For candidates in an active job search.',
    monthly: 24,
    unit: 'per month',
    featured: true,
    cta: 'Start Pro',
    features: [
      'Everything in Free',
      'Unlimited AI mock interviews',
      'Priority AI feedback and scoring',
      'Advanced resume insights',
    ],
  },
  {
    name: 'Team',
    blurb: 'For organizations preparing their engineers.',
    monthly: 49,
    unit: 'per seat / month',
    featured: false,
    cta: 'Get started',
    features: [
      'Everything in Pro, per member',
      'Isolated workspace and seat management',
      'Team performance analytics',
      'Admin controls and audit logging',
    ],
  },
];

function priceFor(monthly: number, discount: number): number {
  if (monthly === 0) return 0;
  return Math.round(monthly * (1 - discount));
}

export function Pricing() {
  const [cadence, setCadence] = React.useState<Cadence>('yearly');
  const activeCadence = CADENCES.find((c) => c.id === cadence) ?? CADENCES[0]!;

  return (
    <SectionShell id="pricing" bordered>
      <Reveal>
        <SectionHeading
          align="center"
          kicker="Pricing"
          title="Start free, upgrade when you're serious"
          description="Simple plans for individuals and teams. No credit card required to begin."
          className="mx-auto"
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-bg-soft) p-1">
            {CADENCES.map((c) => {
              const isActive = c.id === cadence;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCadence(c.id)}
                  aria-pressed={isActive}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-(--radius-full) px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-(--color-surface) text-(--color-text-primary) shadow-(--shadow-soft)'
                      : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
                  }`}
                >
                  {c.label}
                  {c.badge ? (
                    <span className="rounded-(--radius-full) bg-(--color-accent-soft) px-1.5 py-0.5 font-mono text-[10px] font-semibold text-(--color-accent)">
                      {c.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const price = priceFor(tier.monthly, activeCadence.discount);
            return (
              <div
                key={tier.name}
                className={`flex flex-col gap-6 rounded-(--radius-lg) border bg-(--color-surface) p-7 shadow-(--shadow-soft) ${
                  tier.featured
                    ? 'border-(--color-accent) ring-1 ring-(--color-accent)'
                    : 'border-(--color-border-subtle)'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-(--color-text-primary)">
                      {tier.name}
                    </h3>
                    {tier.featured ? (
                      <span className="rounded-(--radius-full) bg-(--color-accent-soft) px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-(--color-accent)">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-(--color-text-muted)">{tier.blurb}</p>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-bold tracking-tight text-(--color-text-primary)">
                    ${price}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider text-(--color-text-muted)">
                    {tier.monthly === 0 ? tier.unit : `/ ${tier.unit}`}
                  </span>
                </div>

                <Link
                  href="/register"
                  className={`inline-flex items-center justify-center rounded-(--radius-full) px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${
                    tier.featured
                      ? 'bg-(--color-accent) text-white'
                      : 'border border-(--color-border) bg-(--color-bg) text-(--color-text-primary) hover:bg-(--color-badge-bg)'
                  }`}
                >
                  {tier.cta}
                </Link>

                <ul className="flex flex-col gap-3 border-t border-(--color-border-subtle) pt-5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-(--color-text-primary)"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Reveal>

      <p className="mt-8 text-center font-mono text-xs uppercase tracking-[0.1em] text-(--color-text-muted)">
        Prices in USD · Discounted cadences billed upfront
      </p>
    </SectionShell>
  );
}
