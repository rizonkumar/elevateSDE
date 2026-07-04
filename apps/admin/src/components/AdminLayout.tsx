'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ToggleLeft,
  ShieldAlert,
  Trophy,
  Code2,
  CalendarDays,
  Medal,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useToastStore } from '../store/toast.store';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const COLLAPSE_KEY = 'admin-sidebar-collapsed';

export function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const docTheme = document.documentElement.dataset.theme as 'light' | 'dark' | undefined;
    if (docTheme) {
      setTheme(docTheme);
    }
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === 'true');
  }, []);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('theme', nextTheme);
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  const handleLogout = () => {
    clearAuth();
    addToast('Logged out successfully.', 'success');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Tenants', href: '/tenants', icon: Building2 },
    { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
    { name: 'Feature Flags', href: '/feature-flags', icon: ToggleLeft },
    { name: 'Forum Moderation', href: '/forum-moderation', icon: ShieldAlert },
    { name: 'Leaderboard', href: '/leaderboard-management', icon: Trophy },
    { name: 'Coding Problems', href: '/coding-problems', icon: Code2 },
    { name: 'Daily Challenges', href: '/daily-challenges', icon: CalendarDays },
    { name: 'Badges', href: '/badges', icon: Medal },
  ];

  const rail = mounted && collapsed;
  const hideOnRail = rail ? 'lg:hidden' : '';

  return (
    <div className="flex h-screen overflow-hidden bg-(--color-bg) text-(--color-text-primary) transition-colors duration-200">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 transform flex-col border-r border-(--color-border-subtle) bg-(--color-surface) transition-all duration-200 lg:static lg:translate-x-0 ${
          rail ? 'lg:w-[76px]' : 'lg:w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`flex h-16 shrink-0 items-center justify-between border-b border-(--color-border-subtle) px-6 ${
            rail ? 'lg:justify-center lg:px-0' : ''
          }`}
        >
          <div className={`text-lg font-bold tracking-tight ${hideOnRail}`}>
            Elevate<span className="text-(--color-accent)">SDE</span>
            <span className="ml-1 rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Admin
            </span>
          </div>
          {rail && (
            <div className="hidden text-lg font-bold tracking-tight lg:block">
              E<span className="text-(--color-accent)">S</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="cursor-pointer rounded-md p-1.5 text-(--color-text-muted) hover:bg-(--color-badge-bg) lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4 shrink-0" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={rail ? item.name : undefined}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-(--color-accent) text-white'
                    : 'text-(--color-text-muted) hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)'
                } ${rail ? 'lg:justify-center lg:gap-0 lg:px-0' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={hideOnRail}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 flex-col gap-3 border-t border-(--color-border-subtle) p-4">
          <div
            className={`flex items-center justify-between px-2 ${rail ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <div className={`flex min-w-0 flex-col ${hideOnRail}`}>
              <span className="truncate text-xs leading-4 font-semibold">
                {mounted ? user?.email || 'Administrator' : 'Administrator'}
              </span>
              <span className="font-mono text-[10px] tracking-wider text-(--color-text-muted) uppercase">
                System Admin
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="cursor-pointer rounded-md p-1.5 text-(--color-text-muted) hover:bg-(--color-badge-bg)"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 shrink-0" />
              ) : (
                <Sun className="h-4 w-4 shrink-0" />
              )}
            </button>
          </div>
          <button
            onClick={handleLogout}
            title={rail ? 'Logout' : undefined}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-(--color-border-subtle) px-4 py-2 text-xs font-semibold transition-colors hover:bg-(--color-danger-soft) hover:text-(--color-danger) ${
              rail ? 'lg:px-0' : ''
            }`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span className={hideOnRail}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-(--color-border-subtle) bg-(--color-surface) px-4 sm:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer rounded-md p-1.5 text-(--color-text-muted) hover:bg-(--color-badge-bg) lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5 shrink-0" />
          </button>
          <button
            onClick={toggleCollapsed}
            className="hidden cursor-pointer rounded-md p-1.5 text-(--color-text-muted) hover:bg-(--color-badge-bg) lg:flex"
            aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {rail ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0" />
            ) : (
              <PanelLeftClose className="h-5 w-5 shrink-0" />
            )}
          </button>
          <h1 className="text-base font-semibold tracking-tight">
            {navItems.find((item) => item.href === pathname)?.name || 'Backoffice'}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto bg-(--color-bg-soft) p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
