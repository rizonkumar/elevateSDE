'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Shield,
  LogOut,
  Briefcase,
  FileText,
  Mic2,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../lib/api';

interface NavbarProps {
  wide?: boolean;
}

interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  external?: boolean;
}

export function Navbar({ wide = false }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const current = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    if (current) {
      setTheme(current);
    } else {
      const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(system);
    }
  }, []);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  const showAuth = mounted && isAuthenticated;
  const containerClass = wide ? 'max-w-[1400px]' : 'max-w-[var(--page-max-width)]';

  const navLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/job-tracker', label: 'Job Tracker', icon: Briefcase },
    { href: '/dashboard/resume', label: 'Resume Analyzer', icon: FileText },
    { href: '/dashboard/mock-interview', label: 'Mock Interview', icon: Mic2 },
  ];
  if (user?.role === 'TENANT_ADMIN') {
    navLinks.push({ href: '/dashboard/org', label: 'Organization', icon: Building2 });
  }
  if (user?.role === 'ADMIN') {
    navLinks.push({ href: '/admin', label: 'Admin Console', icon: Shield, external: true });
  }

  const initial = user?.email?.charAt(0).toUpperCase() ?? 'U';

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)] transition-colors duration-200">
      <div className={`${containerClass} mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-8 min-w-0">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] hover:opacity-85 shrink-0"
          >
            Elevate<span className="text-[var(--color-accent)]">SDE</span>
          </Link>

          {showAuth && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = !link.external && isActive(link.href);
                const className = `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-badge-bg)]'
                }`;
                return link.external ? (
                  <a key={link.href} href={link.href} className={className}>
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href} className={className}>
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-[var(--color-border-subtle)] hover:bg-[var(--color-badge-bg)] text-[var(--color-text-primary)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {showAuth ? (
            <>
              <div className="hidden md:flex items-center gap-3 pl-1">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold shrink-0">
                    {initial}
                  </span>
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate max-w-[180px]">
                      {user?.email}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-badge-bg)] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </div>

              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="md:hidden p-2 rounded-full border border-[var(--color-border-subtle)] hover:bg-[var(--color-badge-bg)] text-[var(--color-text-primary)] transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                Log In
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {showAuth && menuOpen && (
        <div className="md:hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-bg)]">
          <div className={`${containerClass} mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1`}>
            <div className="flex items-center gap-3 px-2 pb-3 mb-2 border-b border-[var(--color-border-subtle)]">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold shrink-0">
                {initial}
              </span>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {user?.email}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                  {user?.role}
                </span>
              </div>
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = !link.external && isActive(link.href);
              const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-badge-bg)]'
              }`;
              return link.external ? (
                <a key={link.href} href={link.href} className={className}>
                  <Icon className="w-4 h-4" />
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} className={className}>
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-badge-bg)] transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
