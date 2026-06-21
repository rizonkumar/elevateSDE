import Link from 'next/link';
import { Check } from 'lucide-react';
import { SectionShell } from './SectionShell';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

interface Tier {
  name: string;
  blurb: string;
  priceLabel: string;
  unit: string;
  available: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    blurb: 'For individual engineers getting started.',
    priceLabel: '$0',
    unit: 'forever',
    available: true,
    features: [
      'Coding assessments from the full bank',
      'Resume ATS analysis',
      'Job tracker, forum, and leaderboard',
      'AI mock interviews',
    ],
  },
  {
    name: 'Pro',
    blurb: 'For candidates in an active job search.',
    priceLabel: 'Coming soon',
    unit: '',
    available: false,
    features: [
      'Everything in Free',
      'Higher AI mock interview limits',
      'Priority AI feedback and scoring',
      'Advanced resume insights',
    ],
  },
  {
    name: 'Team',
    blurb: 'For organizations preparing their engineers.',
    priceLabel: 'Coming soon',
    unit: '',
    available: false,
    features: [
      'Everything in Pro, per member',
      'Isolated workspace and seat management',
      'Team performance analytics',
      'Admin controls and audit logging',
    ],
  },
];

export function Pricing() {
  return (
    <SectionShell id="pricing" bordered>
      <Reveal>
        <SectionHeading
          align="center"
          kicker="Pricing"
          title="Free for everyone while we're in early access"
          description="Every feature is unlocked for everyone right now. Paid plans are coming soon — you'll get plenty of notice before anything changes."
          className="mx-auto"
        />
      </Reveal>

      <Reveal delay={0.08} className="mt-8">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-border-subtle) bg-(--color-bg-soft) px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-(--color-accent)">
            <span className="h-1.5 w-1.5 rounded-full bg-(--color-accent)" />
            <span>Early access · Free for everyone</span>
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col gap-6 rounded-lg border bg-(--color-surface) p-7 shadow-(--shadow-soft) ${
                tier.available
                  ? 'border-(--color-accent) ring-1 ring-(--color-accent)'
                  : 'border-(--color-border-subtle)'
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-(--color-text-primary)">{tier.name}</h3>
                  {tier.available ? (
                    <span className="rounded-full bg-(--color-accent-soft) px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-(--color-accent)">
                      Available now
                    </span>
                  ) : (
                    <span className="rounded-full border border-(--color-border-subtle) px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-(--color-text-muted)">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-(--color-text-muted)">{tier.blurb}</p>
              </div>

              <div className="flex items-baseline gap-1.5">
                {tier.available ? (
                  <>
                    <span className="font-display text-4xl font-bold tracking-tight text-(--color-text-primary)">
                      {tier.priceLabel}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider text-(--color-text-muted)">
                      {tier.unit}
                    </span>
                  </>
                ) : (
                  <span className="font-display text-2xl font-semibold tracking-tight text-(--color-text-muted)">
                    {tier.priceLabel}
                  </span>
                )}
              </div>

              <Link
                href="/register"
                className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${
                  tier.available
                    ? 'bg-(--color-accent) text-white'
                    : 'border border-(--color-border) bg-(--color-bg) text-(--color-text-primary) hover:bg-(--color-badge-bg)'
                }`}
              >
                Get started free
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
          ))}
        </div>
      </Reveal>

      <p className="mt-8 text-center font-mono text-xs uppercase tracking-widest text-(--color-text-muted)">
        No credit card required · Everything free during early access
      </p>
    </SectionShell>
  );
}
