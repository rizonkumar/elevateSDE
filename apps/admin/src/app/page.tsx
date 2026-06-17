'use client';

import * as React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { api } from '../lib/api';
import { useToastStore } from '../store/toast.store';
import { Users, Building2, ToggleLeft, Activity, ArrowRight, Gauge, ShieldCheck } from 'lucide-react';
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
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-(--color-text-muted) animate-pulse">
            Loading dashboard analytics...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                      {card.name}
                    </span>
                    <Icon className="w-5 h-5 text-(--color-accent) shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold font-display tracking-tight text-(--color-text-primary)">
                      {card.value}
                    </span>
                    <span className="text-xs text-(--color-text-muted) mt-1">
                      {card.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider mb-4">
              System Operations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {opsCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                        {card.name}
                      </span>
                      <Icon className="w-5 h-5 text-(--color-accent) shrink-0" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold font-display tracking-tight text-(--color-text-primary)">
                        {card.value}
                      </span>
                      <span className="text-xs text-(--color-text-muted) mt-1">
                        {card.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="p-6 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-(--color-border-subtle) pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-(--color-accent) shrink-0" />
                  <h2 className="text-sm font-semibold text-(--color-text-primary)">
                    Recent System Actions & Audit Trails
                  </h2>
                </div>
                <Link
                  href="/audit-logs"
                  className="text-xs font-semibold text-(--color-accent) hover:opacity-80 flex items-center gap-1"
                >
                  View full history
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-(--color-text-muted)">
                  No system events recorded yet.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-wider font-mono text-(--color-text-primary)">
                          {log.action}
                        </span>
                        {log.metadata && (
                          <pre className="text-[10px] bg-(--color-bg-soft) p-2 rounded border border-(--color-border-subtle) font-mono text-(--color-text-muted) overflow-x-auto max-w-full">
                            {JSON.stringify(log.metadata)}
                          </pre>
                        )}
                      </div>
                      <div className="flex flex-col sm:items-end text-[10px] text-(--color-text-muted) font-mono shrink-0">
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
