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
    <div className="min-h-screen grid lg:grid-cols-2 bg-(--color-bg) transition-colors duration-200">
      <aside className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-(--color-bg-soft) border-r border-(--color-border-subtle)">
        <div className="flex items-center gap-2 select-none">
          <span className="text-xl font-bold tracking-tight text-(--color-text-primary)">
            Elevate<span className="text-(--color-accent)">SDE</span>
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-(--color-badge-bg) border border-(--color-border-subtle) text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">
            Admin
          </span>
        </div>

        <div className="flex flex-col gap-8 max-w-md">
          <div className="flex flex-col gap-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-(--color-accent-soft) text-(--color-accent)">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-(--color-text-primary)">
                Secure backoffice console
              </h1>
              <p className="text-sm text-(--color-text-muted) mt-3 leading-relaxed">
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
                  <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-(--color-badge-bg) text-(--color-text-primary)">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-(--color-text-primary)">
                      {capability.label}
                    </p>
                    <p className="text-xs text-(--color-text-muted) mt-0.5 leading-relaxed">
                      {capability.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-(--color-text-muted) max-w-md leading-relaxed">
          Candidates and organizations should use the standard sign in instead.
        </p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
