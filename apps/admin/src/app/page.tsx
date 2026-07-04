'use client';

import * as React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { api } from '../lib/api';
import { useToastStore } from '../store/toast.store';
import {
  Users,
  Building2,
  ToggleLeft,
  Activity,
  ArrowRight,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { AdminStatsDto, AuditLogDto, FeatureFlagDto } from '@elevatesde/shared-types';
import Link from 'next/link';

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function DashboardPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [stats, setStats] = React.useState<AdminStatsDto | null>(null);
  const [logs, setLogs] = React.useState<AuditLogDto[]>([]);
  const [flags, setFlags] = React.useState<FeatureFlagDto[]>([]);
  const [auditTotal, setAuditTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsRes, logsRes, flagsRes] = await Promise.all([
          api.get<AdminStatsDto>('/api/v1/admin/stats'),
          api.get<AuditLogDto[]>('/api/v1/admin/audit-logs'),
          api.get<FeatureFlagDto[]>('/api/v1/admin/feature-flags'),
        ]);
        setStats(statsRes.data);
        setAuditTotal(logsRes.data.length);
        setLogs(logsRes.data.slice(0, 5));
        setFlags(flagsRes.data);
      } catch (err) {
        const axiosError = err as AxiosErrorResponse;
        addToast(axiosError.response?.data?.message || 'Failed to load dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [addToast]);

  const cards = [
    {
      name: 'Total Registered Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: 'System accounts across all roles',
    },
    {
      name: 'B2B Tenants',
      value: stats?.totalTenants ?? 0,
      icon: Building2,
      description: 'Corporate client workspaces',
    },
    {
      name: 'Active Feature Flags',
      value: stats?.activeFeatureFlagsCount ?? 0,
      icon: ToggleLeft,
      description: 'Enabled beta toggles and rollouts',
    },
  ];

  const enabledFlags = flags.filter((flag) => flag.isEnabled).length;
  const avgRollout = flags.length
    ? Math.round(flags.reduce((sum, flag) => sum + flag.percentageRollout, 0) / flags.length)
    : 0;

  const opsCards = [
    {
      name: 'Platform status',
      value: 'Operational',
      icon: ShieldCheck,
      description: 'API, database, and queue services healthy',
    },
    {
      name: 'Feature flag coverage',
      value: `${enabledFlags}/${flags.length}`,
      icon: ToggleLeft,
      description: 'Flags currently enabled across the platform',
    },
    {
      name: 'Average rollout',
      value: `${avgRollout}%`,
      icon: Gauge,
      description: `${auditTotal} audit events tracked`,
    },
  ];

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <span className="animate-pulse text-sm text-(--color-text-muted)">
            Loading dashboard analytics...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {cards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-4 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                      {card.name}
                    </span>
                    <Icon className="h-5 w-5 shrink-0 text-(--color-accent)" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-3xl font-bold tracking-tight text-(--color-text-primary)">
                      {card.value}
                    </span>
                    <span className="mt-1 text-xs text-(--color-text-muted)">
                      {card.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="mb-4 text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
              System Operations
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {opsCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-4 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                        {card.name}
                      </span>
                      <Icon className="h-5 w-5 shrink-0 text-(--color-accent)" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display text-2xl font-bold tracking-tight text-(--color-text-primary)">
                        {card.value}
                      </span>
                      <span className="mt-1 text-xs text-(--color-text-muted)">
                        {card.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col gap-6 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-(--color-border-subtle) pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 shrink-0 text-(--color-accent)" />
                  <h2 className="text-sm font-semibold text-(--color-text-primary)">
                    Recent System Actions & Audit Trails
                  </h2>
                </div>
                <Link
                  href="/audit-logs"
                  className="flex items-center gap-1 text-xs font-semibold text-(--color-accent) hover:opacity-80"
                >
                  View full history
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {logs.length === 0 ? (
                <div className="py-8 text-center text-xs text-(--color-text-muted)">
                  No system events recorded yet.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="font-mono text-xs font-semibold tracking-wider text-(--color-text-primary) uppercase">
                          {log.action}
                        </span>
                        {log.metadata && (
                          <pre className="max-w-full overflow-x-auto rounded border border-(--color-border-subtle) bg-(--color-bg-soft) p-2 font-mono text-[10px] text-(--color-text-muted)">
                            {JSON.stringify(log.metadata)}
                          </pre>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col font-mono text-[10px] text-(--color-text-muted) sm:items-end">
                        <span>User ID: {log.userId || 'system'}</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
