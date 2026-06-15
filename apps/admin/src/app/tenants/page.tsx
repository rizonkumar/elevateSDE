'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { api } from '../../lib/api';
import { useToastStore } from '../../store/toast.store';
import { TenantDto } from '@elevatesde/shared-types';

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function TenantsPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [tenants, setTenants] = React.useState<TenantDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadTenants() {
      try {
        const res = await api.get<TenantDto[]>('/api/v1/admin/tenants');
        setTenants(res.data);
      } catch (err) {
        const axiosError = err as AxiosErrorResponse;
        addToast(axiosError.response?.data?.message || 'Failed to retrieve B2B tenants.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadTenants();
  }, [addToast]);

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-[var(--color-text-muted)] animate-pulse">
            Retrieving tenant directories...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="px-6 py-4">Tenant ID</th>
                  <th className="px-6 py-4">Organization Name</th>
                  <th className="px-6 py-4">Stripe Customer ID</th>
                  <th className="px-6 py-4">Subscription Plan</th>
                  <th className="px-6 py-4">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {tenants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-xs text-[var(--color-text-muted)]"
                    >
                      No corporate workspaces registered yet.
                    </td>
                  </tr>
                ) : (
                  tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="hover:bg-[var(--color-bg-soft)]/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)]">
                        {tenant.id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">
                        {tenant.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)]">
                        {tenant.stripeCustomerId || 'None'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            tenant.subscriptionPlan === 'ENTERPRISE'
                              ? 'bg-sky-50/50 text-sky-700 border border-sky-500/20 dark:bg-sky-950/20 dark:text-sky-300'
                              : tenant.subscriptionPlan === 'PRO'
                                ? 'bg-emerald-50/50 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-300'
                                : 'bg-zinc-50/50 text-zinc-700 border border-zinc-500/20 dark:bg-zinc-800/20 dark:text-zinc-300'
                          }`}
                        >
                          {tenant.subscriptionPlan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--color-text-muted)] font-mono">
                        {new Date(tenant.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
