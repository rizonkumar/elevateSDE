import * as React from 'react';
import { ShieldCheck, Users, Building2, ScrollText, Flag, type LucideIcon } from 'lucide-react';

interface Capability {
  icon: LucideIcon;
  label: string;
  description: string;
}

const CAPABILITIES: Capability[] = [
  { icon: Users, label: 'Users & roles', description: 'Manage every account and permission.' },
  { icon: Building2, label: 'Tenants & billing', description: 'Oversee B2B workspaces and plans.' },
  { icon: ScrollText, label: 'Audit logs', description: 'Trace every administrative action.' },
  { icon: Flag, label: 'Feature flags', description: 'Roll features out safely and gradually.' },
];

interface AdminAuthLayoutProps {
  children: React.ReactNode;
}

export function AdminAuthLayout({ children }: AdminAuthLayoutProps) {
  return (
    <div className="grid min-h-screen bg-(--color-bg) transition-colors duration-200 lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-(--color-border-subtle) bg-(--color-bg-soft) p-12 lg:flex xl:p-16">
        <div className="flex items-center gap-2 select-none">
          <span className="text-xl font-bold tracking-tight text-(--color-text-primary)">
            Elevate<span className="text-(--color-accent)">SDE</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) px-2 py-0.5 text-[10px] font-bold tracking-widest text-(--color-text-muted) uppercase">
            Admin
          </span>
        </div>

        <div className="flex max-w-md flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-(--color-text-primary) xl:text-3xl">
                Secure backoffice console
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-(--color-text-muted)">
                Restricted to authorized administrators. Every action you take here is recorded in
                the audit log.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-3.5">
            {CAPABILITIES.map((capability) => {
              const Icon = capability.icon;
              return (
                <li key={capability.label} className="flex items-start gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-badge-bg) text-(--color-text-primary)">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-(--color-text-primary)">
                      {capability.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-(--color-text-muted)">
                      {capability.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="max-w-md text-xs leading-relaxed text-(--color-text-muted)">
          Candidates and organizations should use the standard sign in instead.
        </p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
