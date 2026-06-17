'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Shield, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { buildNavLinks, isNavItemActive } from '@/lib/dashboard-nav';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const links = buildNavLinks(user?.role);

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const renderContent = (showClose: boolean) => (
    <>
      <div className="flex h-16 items-center justify-between border-b border-(--color-border-subtle) px-5">
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight text-(--color-text-primary) hover:opacity-85"
        >
          Elevate<span className="text-(--color-accent)">SDE</span>
        </Link>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-full p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isNavItemActive(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-(--color-accent-soft) text-(--color-accent)'
                  : 'text-(--color-text-muted) hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-(--color-border-subtle) px-3 py-4">
        {user?.role === 'ADMIN' && (
          <a
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)"
          >
            <Shield className="h-4 w-4 shrink-0" />
            Admin Console
            <ExternalLink className="ml-auto h-3.5 w-3.5" />
          </a>
        )}
        <ThemeToggle withLabel />
      </div>
    </>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-(--color-border-subtle) bg-(--color-bg) lg:flex">
        {renderContent(false)}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-r border-(--color-border-subtle) bg-(--color-bg)">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
