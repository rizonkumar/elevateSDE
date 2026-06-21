import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

export function CtaSection() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <Reveal>
        <div className="flex flex-col items-center gap-6 rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-bg-soft) px-6 py-16 text-center sm:px-10">
          <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-(--color-accent)">
            Get started
          </span>
          <h2 className="max-w-2xl font-display text-3xl font-bold leading-[1.1] tracking-tight text-(--color-text-primary) sm:text-4xl">
            Ready to ace your next engineering interview?
          </h2>
          <p className="max-w-xl text-base text-(--color-text-muted)">
            Join engineers preparing smarter with AI-driven mock interviews, real test cases, and
            personalized feedback.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-(--radius-full) bg-(--color-accent) px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-(--radius-full) border border-(--color-border) bg-(--color-bg) px-6 py-3 text-sm font-semibold text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
            >
              Log in
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
