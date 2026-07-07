'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Flag,
  ScrollText,
  Code2,
  Swords,
  CalendarClock,
  Award,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SectionShell } from './SectionShell';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { AppWindow } from './AppWindow';
import { ThemedShot } from './ThemedShot';

interface AdminTab {
  id: string;
  label: string;
  icon: LucideIcon;
  shot: string;
  route: string;
  caption: string;
  alt: string;
}

const DASHBOARD_TAB: AdminTab = {
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
  shot: 'admin-dashboard',
  route: 'admin.elevatesde.dev',
  caption: 'Platform health, feature-flag coverage, and a live audit trail at a glance.',
  alt: 'Admin dashboard with platform stats and recent audit trail',
};

const TABS: AdminTab[] = [
  DASHBOARD_TAB,
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    shot: 'admin-users',
    route: 'admin.elevatesde.dev/users',
    caption: 'Manage every account and change roles across all system users.',
    alt: 'User management table with roles and role-change controls',
  },
  {
    id: 'tenants',
    label: 'Tenants',
    icon: Building2,
    shot: 'admin-tenants',
    route: 'admin.elevatesde.dev/tenants',
    caption: 'Oversee B2B workspaces, subscription plans, and seat usage.',
    alt: 'Tenant management table with organizations and subscription plans',
  },
  {
    id: 'feature-flags',
    label: 'Feature Flags',
    icon: Flag,
    shot: 'admin-feature-flags',
    route: 'admin.elevatesde.dev/feature-flags',
    caption: 'Roll features out gradually with percentage-based flags.',
    alt: 'Feature flag management with rollout percentages and toggles',
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    icon: ScrollText,
    shot: 'admin-audit-logs',
    route: 'admin.elevatesde.dev/audit-logs',
    caption: 'An immutable trail of every administrative action for SOC 2 / ISO 27001.',
    alt: 'Audit log timeline of administrative actions with metadata',
  },
  {
    id: 'coding-problems',
    label: 'Coding Problems',
    icon: Code2,
    shot: 'admin-coding-problems',
    route: 'admin.elevatesde.dev/coding-problems',
    caption: 'Author problems, define visible and hidden test cases, and publish.',
    alt: 'Coding problem bank with test-case counts and publish toggles',
  },
  {
    id: 'contests',
    label: 'Contests',
    icon: Swords,
    shot: 'admin-contests',
    route: 'admin.elevatesde.dev/contests',
    caption: 'Assemble timed contests from the problem bank and schedule them.',
    alt: 'Contest management with schedule window, status, and problem count',
  },
  {
    id: 'daily-challenges',
    label: 'Daily Challenges',
    icon: CalendarClock,
    shot: 'admin-daily-challenges',
    route: 'admin.elevatesde.dev/daily-challenges',
    caption: 'Schedule the daily problem candidates solve to build streaks.',
    alt: 'Daily challenge scheduler assigning problems to dates',
  },
  {
    id: 'badges',
    label: 'Badges',
    icon: Award,
    shot: 'admin-badges',
    route: 'admin.elevatesde.dev/badges',
    caption: 'Define achievement criteria and grant or revoke badges for candidates.',
    alt: 'Badge management with criteria, thresholds, and active toggles',
  },
  {
    id: 'moderation',
    label: 'Moderation',
    icon: ShieldCheck,
    shot: 'admin-forum-moderation',
    route: 'admin.elevatesde.dev/forum-moderation',
    caption: 'Review reported posts and keep the community healthy.',
    alt: 'Forum moderation queue with post statuses and report counts',
  },
];

export function AdminShowcase() {
  const [activeId, setActiveId] = React.useState(DASHBOARD_TAB.id);
  const active = TABS.find((tab) => tab.id === activeId) ?? DASHBOARD_TAB;

  return (
    <SectionShell id="backoffice" bordered>
      <Reveal>
        <SectionHeading
          kicker="The backoffice"
          title="Operate the whole platform from one console"
          description="A dedicated admin workspace for the teams running ElevateSDE — user and tenant administration, content authoring, gamification, moderation, and compliance-grade audit logs."
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                aria-pressed={isActive}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-(--radius-full) border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)'
                    : 'border-(--color-border-subtle) bg-(--color-surface) text-(--color-text-muted) hover:text-(--color-text-primary)'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-6">
        <AppWindow label={active.route}>
          <div className="aspect-16/10 w-full sm:aspect-video">
            <ThemedShot
              key={active.shot}
              name={active.shot}
              alt={active.alt}
              width={1440}
              height={900}
              position="object-top"
            />
          </div>
        </AppWindow>
        <p className="mt-4 text-center font-mono text-xs uppercase tracking-widest text-(--color-text-muted)">
          {active.caption}
        </p>
      </Reveal>
    </SectionShell>
  );
}
