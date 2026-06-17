'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-5 rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-bg-soft) px-6 py-12 text-center sm:px-10">
        <h2 className="max-w-2xl font-display text-2xl font-bold tracking-tight text-(--color-text-primary) sm:text-3xl">
          Ready to ace your next engineering interview?
        </h2>
        <p className="max-w-xl text-sm text-(--color-text-muted) sm:text-base">
          Join engineers preparing smarter with AI-driven mock interviews and personalized feedback.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Create your free account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
