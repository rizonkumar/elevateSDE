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
  ];

  const rail = mounted && collapsed;
  const hideOnRail = rail ? 'lg:hidden' : '';

  return (
    <div className="h-screen overflow-hidden flex bg-(--color-bg) text-(--color-text-primary) transition-colors duration-200">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-(--color-border-subtle) bg-(--color-surface) flex flex-col shrink-0 transform transition-all duration-200 lg:static lg:translate-x-0 ${
          rail ? 'lg:w-[76px]' : 'lg:w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`h-16 px-6 border-b border-(--color-border-subtle) flex items-center justify-between shrink-0 ${
            rail ? 'lg:px-0 lg:justify-center' : ''
          }`}
        >
          <div className={`font-bold tracking-tight text-lg ${hideOnRail}`}>
            Elevate<span className="text-(--color-accent)">SDE</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-500 uppercase tracking-widest font-mono">
              Admin
            </span>
          </div>
          {rail && (
            <div className="hidden lg:block font-bold tracking-tight text-lg">
              E<span className="text-(--color-accent)">S</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-md hover:bg-(--color-badge-bg) text-(--color-text-muted) cursor-pointer lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={rail ? item.name : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-(--color-accent) text-white'
                    : 'text-(--color-text-muted) hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)'
                } ${rail ? 'lg:justify-center lg:px-0 lg:gap-0' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={hideOnRail}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-(--color-border-subtle) flex flex-col gap-3 shrink-0">
          <div
            className={`flex items-center justify-between px-2 ${rail ? 'lg:px-0 lg:justify-center' : ''}`}
          >
            <div className={`flex flex-col min-w-0 ${hideOnRail}`}>
              <span className="text-xs font-semibold truncate leading-4">
                {mounted ? user?.email || 'Administrator' : 'Administrator'}
              </span>
              <span className="text-[10px] text-(--color-text-muted) uppercase tracking-wider font-mono">
                System Admin
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-(--color-badge-bg) text-(--color-text-muted) cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 shrink-0" />
              ) : (
                <Sun className="w-4 h-4 shrink-0" />
              )}
            </button>
          </div>
          <button
            onClick={handleLogout}
            title={rail ? 'Logout' : undefined}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm border border-(--color-border-subtle) hover:bg-(--color-danger-soft) hover:text-(--color-danger) transition-colors cursor-pointer ${
              rail ? 'lg:px-0' : ''
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className={hideOnRail}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 px-4 sm:px-8 border-b border-(--color-border-subtle) bg-(--color-surface) flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-(--color-badge-bg) text-(--color-text-muted) cursor-pointer lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5 shrink-0" />
          </button>
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-(--color-badge-bg) text-(--color-text-muted) cursor-pointer"
            aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {rail ? (
              <PanelLeftOpen className="w-5 h-5 shrink-0" />
            ) : (
              <PanelLeftClose className="w-5 h-5 shrink-0" />
            )}
          </button>
          <h1 className="text-base font-semibold tracking-tight">
            {navItems.find((item) => item.href === pathname)?.name || 'Backoffice'}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-(--color-bg-soft)">{children}</div>
      </main>
    </div>
  );
}
