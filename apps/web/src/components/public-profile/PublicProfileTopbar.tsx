'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { useAuthStore } from '@/store/auth.store';

function SessionAction() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const signedIn = mounted && isAuthenticated;

  return (
    <Link
      href={signedIn ? '/dashboard' : '/login'}
      className="inline-flex h-9 items-center gap-1.5 rounded-(--radius-sm) bg-(--color-text-primary) px-3 text-sm font-medium text-(--color-bg) transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
    >
      {signedIn ? 'Open dashboard' : 'Sign in'}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export function PublicProfileTopbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-(--color-border-subtle) bg-(--color-bg)">
      <div className="mx-auto flex h-14 w-full max-w-[1080px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="ElevateSDE home"
          className="flex items-center gap-2.5 rounded-(--radius-sm) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) bg-(--color-accent) text-sm font-bold text-white">
            E
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-(--color-text-primary)">
            Elevate<span className="text-(--color-accent)">SDE</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SessionAction />
        </div>
      </div>
    </header>
  );
}
