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
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useToastStore } from '../store/toast.store';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    const docTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    if (docTheme) {
      setTheme(docTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
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
  ];

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-200">
      <aside className="w-64 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex flex-col shrink-0">
        <div className="h-16 px-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
          <div className="font-bold tracking-tight text-lg">
            Elevate<span className="text-[var(--color-accent)]">SDE</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-500 uppercase tracking-widest font-mono">
              Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-badge-bg)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border-subtle)] flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate leading-4">
                {user?.email || 'Administrator'}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-mono">
                System Admin
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-[var(--color-badge-bg)] text-[var(--color-text-muted)] cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--color-border-subtle)] hover:bg-rose-50/50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 px-8 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex items-center justify-between shrink-0">
          <h1 className="text-base font-semibold tracking-tight">
            {navItems.find((item) => item.href === pathname)?.name || 'Backoffice'}
          </h1>
        </header>

        <div className="flex-1 p-8 bg-[var(--color-bg-soft)]">{children}</div>
      </main>
    </div>
  );
}
