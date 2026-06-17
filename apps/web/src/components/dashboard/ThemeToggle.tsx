'use client';

import * as React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  withLabel?: boolean;
}

export function ThemeToggle({ withLabel = false }: ThemeToggleProps) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const current = document.documentElement.getAttribute('data-theme') as
      | 'light'
      | 'dark'
      | null;
    if (current) {
      setTheme(current);
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  const Icon = theme === 'dark' ? Sun : Moon;
  const label = theme === 'dark' ? 'Light mode' : 'Dark mode';

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label="Toggle theme"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer"
      >
        {mounted ? <Icon className="h-4 w-4" /> : <span className="h-4 w-4" />}
        {mounted ? label : 'Theme'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-full border border-(--color-border-subtle) p-2 text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
    >
      {mounted ? <Icon className="h-4 w-4" /> : <span className="block h-4 w-4" />}
    </button>
  );
}
