import * as React from 'react';
import Link from 'next/link';
import { RoleList } from './RoleList';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--color-bg)] transition-colors duration-200">
      <aside className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-[var(--color-bg-soft)] border-r border-[var(--color-border-subtle)]">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] select-none"
        >
          Elevate<span className="text-[var(--color-accent)]">SDE</span>
        </Link>

        <div className="flex flex-col gap-8 max-w-md">
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold font-display tracking-tight text-[var(--color-text-primary)]">
              Enterprise-grade interview preparation
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-3 leading-relaxed">
              Pick the workspace that fits you. Your access is tailored to your role.
            </p>
          </div>
          <RoleList />
        </div>

        <p className="text-xs text-[var(--color-text-muted)] max-w-md leading-relaxed">
          Your role is set when you register. Candidates and organizations sign in on the right;
          admins use the Admin Console.
        </p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
