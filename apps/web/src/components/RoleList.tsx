import * as React from 'react';
import { GraduationCap, Building2, Shield, type LucideIcon } from 'lucide-react';

interface RoleInfo {
  name: string;
  icon: LucideIcon;
  summary: string;
}

export const ROLES: RoleInfo[] = [
  {
    name: 'Candidate',
    icon: GraduationCap,
    summary: 'Practice AI mock interviews, track job applications, and analyze your resume.',
  },
  {
    name: 'Organization',
    icon: Building2,
    summary: "Everything a candidate gets, plus manage your team's seats and performance.",
  },
  {
    name: 'Admin',
    icon: Shield,
    summary: 'Platform staff. Manage users, tenants, and feature flags from the Admin Console.',
  },
];

export function RoleList() {
  return (
    <ul className="flex flex-col gap-3 text-left">
      {ROLES.map((role) => {
        const Icon = role.icon;
        return (
          <li key={role.name} className="flex items-start gap-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--color-text-primary)">{role.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-(--color-text-muted)">
                {role.summary}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
