'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Shield, ExternalLink, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { buildNavLinks, isNavItemActive } from '@/lib/dashboard-nav';
import { ThemeToggle } from './ThemeToggle';

const COLLAPSE_KEY = 'web-sidebar-collapsed';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const links = buildNavLinks(user?.role);

  const [collapsed, setCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === 'true');
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  const rail = mounted && collapsed;

  const renderContent = (showClose: boolean, isRail: boolean) => (
    <>
      <div
        className={`flex h-16 items-center border-b border-(--color-border-subtle) ${
          isRail ? 'justify-center px-2' : 'justify-between px-5'
        }`}
      >
        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight text-(--color-text-primary) hover:opacity-85"
        >
          {isRail ? (
            <span className="text-(--color-accent)">ES</span>
          ) : (
            <>
              Elevate<span className="text-(--color-accent)">SDE</span>
            </>
          )}
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
              title={isRail ? link.label : undefined}
              className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                isRail ? 'justify-center px-2' : 'px-3'
              } ${
                active
                  ? 'bg-(--color-accent-soft) text-(--color-accent)'
                  : 'text-(--color-text-muted) hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isRail && link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-(--color-border-subtle) px-3 py-4">
        {user?.role === 'ADMIN' && (
          <a
            href="/admin"
            title={isRail ? 'Admin Console' : undefined}
            className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) ${
              isRail ? 'justify-center px-2' : 'px-3'
            }`}
          >
            <Shield className="h-4 w-4 shrink-0" />
            {!isRail && (
              <>
                Admin Console
                <ExternalLink className="ml-auto h-3.5 w-3.5" />
              </>
            )}
          </a>
        )}

        {isRail ? (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        ) : (
          <ThemeToggle withLabel />
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          title={isRail ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`hidden items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer lg:flex ${
            isRail ? 'justify-center px-2' : 'px-3'
          }`}
        >
          {isRail ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              Collapse
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-(--color-border-subtle) bg-(--color-bg) transition-all duration-200 lg:flex ${
          rail ? 'lg:w-[76px]' : 'lg:w-60'
        }`}
      >
        {renderContent(false, rail)}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-r border-(--color-border-subtle) bg-(--color-bg)">
            {renderContent(true, false)}
          </aside>
        </div>
      )}
    </>
  );
}
