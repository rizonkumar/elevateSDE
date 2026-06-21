'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuthStore } from '../store/auth.store';
import { ThemeToggle } from './dashboard/ThemeToggle';
import { UserMenu } from './dashboard/UserMenu';

interface NavbarProps {
  wide?: boolean;
}

export function Navbar({ wide = false }: Readonly<NavbarProps>) {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const showAuth = mounted && isAuthenticated;
  const containerClass = wide ? 'max-w-[1400px]' : 'max-w-(--page-max-width)';

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'Solutions', href: '/#solutions' },
    { label: 'Pricing', href: '/#pricing' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-(--color-border-subtle) bg-(--color-bg) transition-colors duration-200">
      <div
        className={`${containerClass} mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8`}
      >
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight text-(--color-text-primary) hover:opacity-85"
        >
          Elevate<span className="text-(--color-accent)">SDE</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {showAuth ? (
            <>
              <Link href="/dashboard" className="btn-ghost text-sm">
                Dashboard
              </Link>
              <UserMenu />
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
    </header>
  );
}
