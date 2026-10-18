'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@elevatesde/ui';

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const Icon = resolved === 'dark' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-full border border-(--color-border-subtle) p-2 text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
