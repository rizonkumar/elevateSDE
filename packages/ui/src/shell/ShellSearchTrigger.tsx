'use client';

import * as React from 'react';
import { SearchIcon } from './icons';
import { openCommandPalette } from './command-palette-store';

function useShortcutLabel(): string {
  const [label, setLabel] = React.useState('⌘K');
  React.useEffect(() => {
    if (!/mac|iphone|ipad/i.test(navigator.userAgent)) setLabel('Ctrl K');
  }, []);
  return label;
}

export function ShellSearchTrigger() {
  const shortcut = useShortcutLabel();

  return (
    <>
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Search"
        aria-keyshortcuts="Meta+K Control+K"
        className="hidden h-9 w-64 items-center gap-2 rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) pl-3 pr-1.5 text-sm text-(--color-text-disabled) transition-colors hover:border-(--color-border) hover:text-(--color-text-muted) cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:flex"
      >
        <SearchIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="rounded-[4px] border border-(--color-border-subtle) bg-(--color-bg) px-1.5 py-0.5 font-sans text-[11px] font-medium text-(--color-text-muted)">
          {shortcut}
        </kbd>
      </button>
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Search"
        className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer md:hidden"
      >
        <SearchIcon className="h-4 w-4" />
      </button>
    </>
  );
}
