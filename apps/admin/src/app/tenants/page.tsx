'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Badge, type BadgeVariant } from '../../components/ui';
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

function planVariant(plan: string): BadgeVariant {
  if (plan === 'ENTERPRISE') return 'accent';
  if (plan === 'PRO' || plan === 'TEAM') return 'success';
  return 'neutral';
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
          <span className="text-sm text-(--color-text-muted) animate-pulse">
            Retrieving tenant directories...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-(--color-text-muted)">
              Corporate workspaces purchasing seats on the platform.
            </p>
            <span className="text-xs font-semibold text-(--color-text-muted) px-2.5 py-1 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg)">
              {tenants.length} tenants
            </span>
          </div>

          {tenants.length === 0 ? (
            <div className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm px-6 py-12 text-center text-sm text-(--color-text-muted)">
              No corporate workspaces registered yet.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                      <th className="px-6 py-4">Tenant ID</th>
                      <th className="px-6 py-4">Organization Name</th>
                      <th className="px-6 py-4">Stripe Customer ID</th>
                      <th className="px-6 py-4">Subscription Plan</th>
                      <th className="px-6 py-4">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--color-border-subtle)">
                    {tenants.map((tenant) => (
                      <tr
                        key={tenant.id}
                        className="hover:bg-(--color-bg-soft)/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-(--color-text-muted)">
                          <span className="block max-w-[200px] truncate" title={tenant.id}>
                            {tenant.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-(--color-text-primary)">
                          {tenant.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-(--color-text-muted)">
                          {tenant.stripeCustomerId || 'None'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={planVariant(tenant.subscriptionPlan)}>
                            {tenant.subscriptionPlan}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-(--color-text-muted) font-mono">
                          {new Date(tenant.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden flex flex-col gap-4">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-(--color-text-primary)">
                        {tenant.name}
                      </span>
                      <Badge variant={planVariant(tenant.subscriptionPlan)}>
                        {tenant.subscriptionPlan}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-(--color-text-muted) font-mono">
                      <span className="break-all">ID: {tenant.id}</span>
                      <span>Stripe: {tenant.stripeCustomerId || 'None'}</span>
                      <span>{new Date(tenant.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
