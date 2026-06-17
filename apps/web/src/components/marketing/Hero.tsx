'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Mic2, FileText, Gauge } from 'lucide-react';

const CHIPS = [
  'Multi-Tenant Scoping',
  'AI Evaluation Engine',
  'pgvector Similarity',
  'BullMQ Async Processing',
  'Stripe Billing',
];

const PREVIEW_ITEMS = [
  { icon: Mic2, title: 'Mock interview', detail: 'System Design · Senior' },
  { icon: FileText, title: 'Resume analyzed', detail: 'ATS score 86 · 4 fixes' },
  { icon: Gauge, title: 'Readiness', detail: 'Up 18% this week' },
];

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-border-subtle) bg-(--color-bg-soft) px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent)">
            Enterprise AI Interview Prep
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-(--color-text-primary) sm:text-5xl lg:text-6xl">
            Elevate your software engineering career
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-(--color-text-muted) sm:text-lg">
            Practice timed assessments, attend real-time AI mock interviews, and get a personalized
            learning path — built for individual developers and B2B engineering teams alike.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-ghost text-sm">
              Access dashboard
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-(--color-border-subtle) px-2.5 py-1 text-xs font-medium text-(--color-text-muted)"
              >
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-soft) sm:p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
              Your prep, at a glance
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-(--color-accent)">
              <span className="h-1.5 w-1.5 rounded-full bg-(--color-accent)" />
              Live
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {PREVIEW_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-bg-soft) px-4 py-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-(--color-text-primary)">
                      {item.title}
                    </span>
                    <span className="truncate text-xs text-(--color-text-muted)">
                      {item.detail}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
