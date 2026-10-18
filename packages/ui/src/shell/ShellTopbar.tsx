'use client';

import * as React from 'react';
import type { ShellBreadcrumb } from './types';
import { MenuIcon } from './icons';
import { ShellSearchTrigger } from './ShellSearchTrigger';

interface ShellTopbarProps {
  breadcrumb: ShellBreadcrumb | null;
  onOpenSidebar: () => void;
  actions: React.ReactNode;
}

export function ShellTopbar({ breadcrumb, onOpenSidebar, actions }: ShellTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-(--color-border-subtle) bg-(--color-bg) px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        {breadcrumb && (
          <ol className="m-0 flex min-w-0 list-none items-center gap-2 p-0 text-sm">
            {breadcrumb.group && (
              <>
                <li className="hidden shrink-0 text-(--color-text-disabled) sm:block">
                  {breadcrumb.group}
                </li>
                <li aria-hidden="true" className="hidden text-(--color-border) sm:block">
                  /
                </li>
              </>
            )}
            <li aria-current="page" className="truncate font-medium text-(--color-text-primary)">
              {breadcrumb.page}
            </li>
          </ol>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ShellSearchTrigger />
        {actions}
      </div>
    </header>
  );
}
