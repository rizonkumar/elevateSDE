'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../lib/api';

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    if (current) {
      setTheme(current);
    } else {
      const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(system);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    try {
      const Cookies = (await import('js-cookie')).default;
      const token = Cookies.get('refreshToken');
      if (token) {
        await api.post('/api/v1/auth/logout', { refreshToken: token });
      }
    } catch {
      // ignore
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)] transition-colors duration-200">
      <div className="max-w-[var(--page-max-width)] mx-auto px-[var(--page-padding-x)] h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] hover:opacity-85"
        >
          Elevate<span className="text-[var(--color-accent)]">SDE</span>
        </Link>
        <nav className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
              >
                Dashboard
              </Link>
              {user?.role === 'ADMIN' && (
                <a
                  href="/admin"
                  className="text-sm font-medium text-[var(--color-accent)] hover:underline"
                >
                  Admin Console
                </a>
              )}
              <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-badge-bg)] text-[var(--color-text-muted)] select-none">
                  {user?.role}
                </span>
                <span className="text-sm text-[var(--color-text-muted)] hidden sm:inline">
                  {user?.email}
                </span>
                <button onClick={handleLogout} className="btn-ghost text-xs cursor-pointer">
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <a
                href="/admin/login"
                className="text-xs px-2 py-1 border border-zinc-700 text-zinc-500 rounded uppercase tracking-wider hover:text-[var(--color-accent)] transition"
              >
                Admin
              </a>
              <Link href="/login" className="btn-ghost text-sm">
                Log In
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Sign Up
              </Link>
            </>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-[var(--color-border-subtle)] hover:bg-[var(--color-badge-bg)] text-[var(--color-text-primary)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
