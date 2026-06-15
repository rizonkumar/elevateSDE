'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { api } from '../../lib/api';
import { useToastStore } from '../../store/toast.store';
import { useAuthStore } from '../../store/auth.store';
import { UserDto } from '@elevatesde/shared-types';

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function UsersPage() {
  const addToast = useToastStore((state) => state.addToast);
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = React.useState<UserDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const loadUsers = React.useCallback(async () => {
    try {
      const res = await api.get<UserDto[]>('/api/v1/admin/users');
      setUsers(res.data);
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(axiosError.response?.data?.message || 'Failed to retrieve user listing.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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

  const roles = ['USER', 'TENANT_ADMIN', 'ADMIN'];

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-[var(--color-text-muted)] animate-pulse">
            Retrieving account records...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Tenant ID</th>
                  <th className="px-6 py-4">Current Role</th>
                  <th className="px-6 py-4">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[var(--color-bg-soft)]/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)]">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)]">
                      {user.tenantId || 'B2C Account'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          user.role === 'ADMIN'
                            ? 'bg-rose-50/50 text-rose-700 border border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-300'
                            : user.role === 'TENANT_ADMIN'
                              ? 'bg-amber-50/50 text-amber-700 border border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-300'
                              : 'bg-zinc-50/50 text-zinc-700 border border-zinc-500/20 dark:bg-zinc-800/20 dark:text-zinc-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        disabled={updatingId === user.id || currentUser?.id === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none transition disabled:opacity-50 cursor-pointer"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
