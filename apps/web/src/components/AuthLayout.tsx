import * as React from 'react';
import Link from 'next/link';
import { RoleList } from './RoleList';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen bg-(--color-bg) transition-colors duration-200 lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-(--color-border-subtle) bg-(--color-bg-soft) p-12 lg:flex xl:p-16">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-(--color-text-primary) select-none"
        >
          Elevate<span className="text-(--color-accent)">SDE</span>
        </Link>

        <div className="flex max-w-md flex-col gap-8">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-(--color-text-primary) xl:text-3xl">
              Enterprise-grade interview preparation
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
              Pick the workspace that fits you. Your access is tailored to your role.
            </p>
          </div>
          <RoleList />
        </div>

        <p className="max-w-md text-xs leading-relaxed text-(--color-text-muted)">
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
