import type { ReactNode } from 'react';
import { GraduationCap, Building2, ShieldCheck, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SectionShell } from './SectionShell';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { AppWindow } from './AppWindow';
import { ThemedShot } from './ThemedShot';

interface RoleCardProps {
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  points: string[];
  preview: ReactNode;
}

function RoleCard({
  icon: Icon,
  kicker,
  title,
  description,
  points,
  preview,
}: Readonly<RoleCardProps>) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-soft)">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-(--color-accent-soft) text-(--color-accent)">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--color-text-muted)">
          {kicker}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-(--color-text-primary)">{title}</h3>
        <p className="text-sm leading-relaxed text-(--color-text-muted)">{description}</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm text-(--color-text-primary)">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)" />
            {point}
          </li>
        ))}
      </ul>
      <div className="mt-auto h-44 overflow-hidden rounded-md pt-2">{preview}</div>
    </div>
  );
}

function CandidatePreview() {
  const stats = [
    { value: '#18', label: 'Rank' },
    { value: '2,480', label: 'Points' },
    { value: '12d', label: 'Streak' },
  ];
  const bars = [
    { id: 'mon', value: 40 },
    { id: 'tue', value: 65 },
    { id: 'wed', value: 50 },
    { id: 'thu', value: 80 },
    { id: 'fri', value: 70 },
    { id: 'sat', value: 95 },
  ];
  return (
    <div className="flex h-full flex-col gap-2 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) p-4">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-sm border border-(--color-border-subtle) bg-(--color-surface) px-2.5 py-2"
          >
            <div className="text-sm font-bold text-(--color-text-primary)">{stat.value}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-(--color-text-muted)">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-1 items-end gap-1.5">
        {bars.map((bar) => (
          <div
            key={bar.id}
            style={{ height: `${bar.value}%` }}
            className="flex-1 rounded-t-sm bg-(--color-accent-soft)"
          />
        ))}
      </div>
    </div>
  );
}

function AdminPreview() {
  const rows = [
    { label: 'tenant.subscription.updated', tone: 'accent' },
    { label: 'user.role.changed', tone: 'muted' },
    { label: 'feature_flag.toggled', tone: 'muted' },
  ];
  return (
    <div className="flex h-full flex-col gap-2 rounded-md border border-(--color-border-subtle) bg-(--color-bg-soft) p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-(--color-text-muted)">
          Audit log
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-(--radius-full) border border-(--color-border-subtle) px-2 py-0.5 text-[10px] font-medium text-(--color-text-primary)">
          <span className="h-1.5 w-1.5 rounded-full bg-(--color-success)" />
          <span>Live</span>
        </span>
      </div>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between rounded-sm border border-(--color-border-subtle) bg-(--color-surface) px-2.5 py-1.5"
        >
          <span className="truncate font-mono text-[11px] text-(--color-text-muted)">
            {row.label}
          </span>
          <span
            className={`ml-2 h-1.5 w-1.5 shrink-0 rounded-full ${
              row.tone === 'accent' ? 'bg-(--color-accent)' : 'bg-(--color-text-disabled)'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function RoleSplit() {
  return (
    <SectionShell id="solutions" bordered>
      <Reveal>
        <SectionHeading
          kicker="Who it's for"
          title="One platform, three audiences"
          description="Access is tailored to your role — individuals practice and apply, organizations manage their teams, and platform staff keep everything running."
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <div className="grid gap-4 lg:grid-cols-3">
          <RoleCard
            icon={GraduationCap}
            kicker="For candidates"
            title="Practice, apply, and improve"
            description="Individual engineers preparing for their next role get the full preparation toolkit."
            points={[
              'AI mock interviews and timed assessments',
              'Resume ATS analysis with targeted fixes',
              'Job tracker, forum, and leaderboard',
            ]}
            preview={<CandidatePreview />}
          />

          <RoleCard
            icon={Building2}
            kicker="For teams"
            title="Manage your team's prep"
            description="Organizations get an isolated workspace with everything candidates have, plus team controls."
            points={[
              'Seat usage and member invitations',
              'Team performance at a glance',
              'Per-tenant data isolation',
            ]}
            preview={
              <AppWindow label="app.elevatesde.dev/org" className="h-full">
                <div className="h-[calc(100%-2.75rem)]">
                  <ThemedShot
                    name="org"
                    alt="Organization workspace with seat usage and team performance"
                    width={1440}
                    height={900}
                    position="object-top object-left"
                  />
                </div>
              </AppWindow>
            }
          />

          <RoleCard
            icon={ShieldCheck}
            kicker="For admins"
            title="Operate with confidence"
            description="Platform staff run the backoffice with the controls compliance and operations require."
            points={[
              'Immutable audit logs for SOC 2 / ISO 27001',
              'Feature flags with percentage rollout',
              'Tenant management and forum moderation',
            ]}
            preview={<AdminPreview />}
          />
        </div>
      </Reveal>
    </SectionShell>
  );
}
