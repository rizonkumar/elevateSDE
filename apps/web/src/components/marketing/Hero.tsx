'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AppWindow } from './AppWindow';
import { ThemedShot } from './ThemedShot';

const SIGNALS = ['Free candidate plan', 'Real-time AI feedback', 'SOC 2-ready audit trail'];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: 'easeOut' as const, delay },
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-20 pb-12 sm:px-6 sm:pt-28 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <motion.span
          {...rise(0)}
          className="inline-flex items-center gap-2 rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-bg-soft) px-3.5 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-(--color-accent)"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-(--color-accent)" />
          Enterprise AI interview prep
        </motion.span>

        <motion.h1
          {...rise(0.08)}
          className="mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.04] tracking-tight text-(--color-text-primary) sm:text-6xl lg:text-7xl"
        >
          Elevate your software engineering career
        </motion.h1>

        <motion.p
          {...rise(0.16)}
          className="mt-6 max-w-2xl text-base leading-relaxed text-(--color-text-muted) sm:text-lg"
        >
          Timed coding assessments, real-time AI mock interviews, resume analysis, and a job
          tracker — one platform for individual engineers and the teams that hire them.
        </motion.p>

        <motion.div {...rise(0.24)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-(--radius-full) bg-(--color-accent) px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#product"
            className="inline-flex items-center gap-2 rounded-(--radius-full) border border-(--color-border) bg-(--color-bg) px-6 py-3 text-sm font-semibold text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
          >
            See it in action
          </Link>
        </motion.div>

        <motion.ul
          {...rise(0.32)}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.1em] text-(--color-text-muted)"
        >
          {SIGNALS.map((signal) => (
            <li key={signal} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-(--color-text-disabled)" />
              {signal}
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
        className="mt-16"
      >
        <AppWindow label="app.elevatesde.dev/dashboard">
          <div className="aspect-[16/10] w-full sm:aspect-[16/9]">
            <ThemedShot
              name="dashboard"
              alt="ElevateSDE candidate dashboard showing assessment stats, job pipeline, and preparation insights"
              width={1440}
              height={900}
            />
          </div>
        </AppWindow>
      </motion.div>
    </section>
  );
}
