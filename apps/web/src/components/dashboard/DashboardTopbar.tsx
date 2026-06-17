'use client';

import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface DashboardTopbarProps {
  onOpenSidebar: () => void;
}

export function DashboardTopbar({ onOpenSidebar }: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-(--color-border-subtle) bg-(--color-bg) px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open menu"
        className="rounded-full border border-(--color-border-subtle) p-2 text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) lg:hidden cursor-pointer"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="hidden lg:block" />
      <UserMenu />
    </header>
  );
}
