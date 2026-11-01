'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Badge, type BadgeVariant, Select } from '../../components/ui';
import { Button, Tabs } from '@elevatesde/ui';
import { api } from '../../lib/api';
import { fetchPendingAccounts } from '../../lib/account-review-api';
import { useToastStore } from '../../store/toast.store';
import { useAuthStore } from '../../store/auth.store';
import { usePendingAccountsStore } from '../../store/pending-accounts.store';
import type { AccountStatusDto, PendingAccountDto, UserDto } from '@elevatesde/shared-types';
import { PendingAccountsPanel } from './_components/PendingAccountsPanel';

type UsersTab = 'all' | 'pending';

const STATUS_PRESENTATION: Record<AccountStatusDto, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  PENDING_APPROVAL: { label: 'Pending', variant: 'warning' },
  REJECTED: { label: 'Denied', variant: 'danger' },
};

function StatusBadge({ status }: Readonly<{ status: AccountStatusDto }>) {
  const presentation = STATUS_PRESENTATION[status];
  return <Badge variant={presentation.variant}>{presentation.label}</Badge>;
}

function initialTab(): UsersTab | null {
  if (globalThis.window === undefined) return null;
  const tab = new URLSearchParams(globalThis.window.location.search).get('tab');
  return tab === 'pending' || tab === 'all' ? tab : null;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const ROLE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'TENANT_ADMIN', label: 'Tenant Admin' },
  { value: 'ADMIN', label: 'Admin' },
];

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function roleVariant(role: string): BadgeVariant {
  if (role === 'ADMIN') return 'danger';
  if (role === 'TENANT_ADMIN') return 'warning';
  return 'neutral';
}

export default function UsersPage() {
  const addToast = useToastStore((state) => state.addToast);
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = React.useState<UserDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<PendingAccountDto[]>([]);
  const [pendingTotal, setPendingTotal] = React.useState(0);
  const [pendingPage, setPendingPage] = React.useState(1);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [tab, setTab] = React.useState<UsersTab | null>(null);
  const setPendingCount = usePendingAccountsStore((state) => state.setCount);

  const loadUsers = React.useCallback(async () => {
    try {
      const [res, firstPage] = await Promise.all([
        api.get<UserDto[]>('/api/v1/admin/users'),
        fetchPendingAccounts(1),
      ]);
      setUsers(res.data);
      setPending(firstPage.items);
      setPendingTotal(firstPage.total);
      setPendingPage(1);
      setPendingCount(firstPage.total);
      setTab((current) => current ?? initialTab() ?? (firstPage.total > 0 ? 'pending' : 'all'));
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(axiosError.response?.data?.message || 'Failed to retrieve user listing.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, setPendingCount]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (currentUser?.id === userId) {
      addToast('Operation Forbidden: You cannot modify your own administrative role.', 'error');
      return;
    }
    setUpdatingId(userId);
    try {
      await api.patch(`/api/v1/admin/users/${userId}/role`, { role: newRole });
      addToast('User role updated successfully.', 'success');
      await loadUsers();
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(axiosError.response?.data?.message || 'Failed to modify user role.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReviewed = (account: PendingAccountDto, outcome: 'approved' | 'denied') => {
    addToast(
      outcome === 'approved'
        ? `${account.email} approved. They can sign in now.`
        : `${account.email} denied.`,
      'success',
    );
    void loadUsers();
  };

  const loadMorePending = async () => {
    setLoadingMore(true);
    try {
      const next = await fetchPendingAccounts(pendingPage + 1);
      setPending((current) => {
        const seen = new Set(current.map((account) => account.id));
        return [...current, ...next.items.filter((account) => !seen.has(account.id))];
      });
      setPendingTotal(next.total);
      setPendingPage((page) => page + 1);
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(axiosError.response?.data?.message || 'Failed to load more sign-ups.', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const activeTab: UsersTab = tab ?? 'all';

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-(--color-text-muted) animate-pulse">
            Retrieving account records...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              items={[
                { id: 'pending', label: 'Pending approval', count: pendingTotal },
                { id: 'all', label: 'All users', count: users.length },
              ]}
              value={activeTab}
              onChange={(id) => setTab(id === 'pending' ? 'pending' : 'all')}
            />
            <p className="text-sm text-(--color-text-muted)">
              {activeTab === 'pending'
                ? 'New sign-ups cannot sign in until you approve them.'
                : 'Manage roles across all system accounts.'}
            </p>
          </div>

          {activeTab === 'pending' ? (
            <div className="flex flex-col gap-4">
              <PendingAccountsPanel
                accounts={pending}
                onReviewed={handleReviewed}
                onError={(message) => addToast(message, 'error')}
              />
              {pending.length < pendingTotal && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-(--color-text-muted)">
                    Showing {pending.length} of {pendingTotal}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={loadingMore}
                    onClick={() => void loadMorePending()}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-visible rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                      <th className="px-6 py-4">User ID</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">Tenant ID</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Current Role</th>
                      <th className="px-6 py-4">Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--color-border-subtle)">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-(--color-bg-soft)/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-(--color-text-muted)">
                          <span className="block max-w-[200px] truncate" title={user.id}>
                            {user.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-(--color-text-primary)">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-(--color-text-muted)">
                          <span
                            className="block max-w-[180px] truncate"
                            title={user.tenantId || 'B2C Account'}
                          >
                            {user.tenantId || 'B2C Account'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={roleVariant(user.role)}>{roleLabel(user.role)}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            value={user.role}
                            options={ROLE_OPTIONS}
                            disabled={updatingId === user.id || currentUser?.id === user.id}
                            onChange={(role) => handleRoleChange(user.id, role)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden flex flex-col gap-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-(--color-text-primary) break-all">
                        {user.email}
                      </span>
                      <div className="flex shrink-0 gap-1.5">
                        <StatusBadge status={user.status} />
                        <Badge variant={roleVariant(user.role)}>{roleLabel(user.role)}</Badge>
                      </div>
                    </div>
                    <div className="text-xs text-(--color-text-muted) font-mono break-all">
                      {user.tenantId || 'B2C Account'}
                    </div>
                    <Select
                      value={user.role}
                      options={ROLE_OPTIONS}
                      disabled={updatingId === user.id || currentUser?.id === user.id}
                      onChange={(role) => handleRoleChange(user.id, role)}
                      className="w-full"
                    />
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
