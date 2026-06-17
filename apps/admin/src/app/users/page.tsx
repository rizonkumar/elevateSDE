'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Badge, type BadgeVariant, Select } from '../../components/ui';
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-(--color-text-muted)">
              Manage roles across all system accounts.
            </p>
            <span className="text-xs font-semibold text-(--color-text-muted) px-2.5 py-1 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg)">
              {users.length} users
            </span>
          </div>

          <div className="hidden md:block overflow-visible rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Tenant ID</th>
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
                      <span className="block max-w-[180px] truncate" title={user.tenantId || 'B2C Account'}>
                        {user.tenantId || 'B2C Account'}
                      </span>
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
                  <Badge variant={roleVariant(user.role)}>{roleLabel(user.role)}</Badge>
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
        </div>
      )}
    </AdminLayout>
  );
}
