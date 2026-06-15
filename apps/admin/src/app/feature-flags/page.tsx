'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { api } from '../../lib/api';
import { useToastStore } from '../../store/toast.store';
import { Button, Input } from '@elevatesde/ui';
import { FeatureFlagDto } from '@elevatesde/shared-types';
import { Plus, ToggleLeft, ToggleRight, Percent, Settings } from 'lucide-react';

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function FeatureFlagsPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [flags, setFlags] = React.useState<FeatureFlagDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [newFlagKey, setNewFlagKey] = React.useState('');
  const [newIsEnabled, setNewIsEnabled] = React.useState(false);
  const [newRollout, setNewRollout] = React.useState(100);
  const [creating, setCreating] = React.useState(false);

  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const loadFeatureFlags = React.useCallback(async () => {
    try {
      const res = await api.get<FeatureFlagDto[]>('/api/v1/admin/feature-flags');
      setFlags(res.data);
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(axiosError.response?.data?.message || 'Failed to retrieve feature flags.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  React.useEffect(() => {
    loadFeatureFlags();
  }, [loadFeatureFlags]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlagKey) {
      addToast('Please enter a feature flag key.', 'error');
      return;
    }
    setCreating(true);
    try {
      await api.post('/api/v1/admin/feature-flags', {
        flagKey: newFlagKey.toUpperCase().trim(),
        isEnabled: newIsEnabled,
        percentageRollout: Number(newRollout),
      });
      addToast('Feature flag created successfully.', 'success');
      setNewFlagKey('');
      setNewIsEnabled(false);
      setNewRollout(100);
      await loadFeatureFlags();
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(axiosError.response?.data?.message || 'Failed to create feature flag.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      await api.patch(`/api/v1/admin/feature-flags/${id}/toggle`, {
        isEnabled: !currentStatus,
      });
      addToast('Feature flag state updated.', 'success');
      await loadFeatureFlags();
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(axiosError.response?.data?.message || 'Failed to update feature flag.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRolloutChange = async (id: string, value: number) => {
    if (value < 0 || value > 100) return;
    setUpdatingId(id);
    try {
      await api.patch(`/api/v1/admin/feature-flags/${id}/rollout`, {
        percentageRollout: value,
      });
      addToast('Rollout percentage updated.', 'success');
      await loadFeatureFlags();
    } catch (err) {
      const axiosError = err as AxiosErrorResponse;
      addToast(axiosError.response?.data?.message || 'Failed to update rollout.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-[var(--color-text-muted)] animate-pulse">
            Retrieving system feature flags...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="px-6 py-4">Flag Key</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Rollout %</th>
                    <th className="px-6 py-4">Updated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {flags.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-xs text-[var(--color-text-muted)]"
                      >
                        No feature flags defined yet.
                      </td>
                    </tr>
                  ) : (
                    flags.map((flag) => (
                      <tr
                        key={flag.id}
                        className="hover:bg-[var(--color-bg-soft)]/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs font-bold text-[var(--color-text-primary)]">
                          {flag.flagKey}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            disabled={updatingId === flag.id}
                            onClick={() => handleToggle(flag.id, flag.isEnabled)}
                            className="focus:outline-none transition disabled:opacity-50 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-left cursor-pointer"
                          >
                            {flag.isEnabled ? (
                              <>
                                <ToggleRight className="w-6 h-6 text-emerald-500 shrink-0" />
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  Active
                                </span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-6 h-6 text-zinc-500 shrink-0" />
                                <span className="text-zinc-500">Disabled</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={flag.percentageRollout}
                              disabled={updatingId === flag.id}
                              onChange={(e) => handleRolloutChange(flag.id, Number(e.target.value))}
                              className="w-24 accent-[var(--color-accent)] cursor-pointer"
                            />
                            <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)] w-8 text-right">
                              {flag.percentageRollout}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-[var(--color-text-muted)] font-mono">
                          {new Date(flag.updatedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm flex flex-col gap-6">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border-subtle)] pb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
              Define Feature Flag
            </h2>

            <form onSubmit={handleCreate} className="flex flex-col gap-6">
              <Input
                type="text"
                label="Flag Unique Key"
                placeholder="E.G. NEW_INTEGRATION_BETA"
                value={newFlagKey}
                onChange={(e) => setNewFlagKey(e.target.value)}
                disabled={creating}
                required
                icon={<Settings className="w-4 h-4 text-[var(--color-text-muted)]" />}
              />

              <div className="flex items-center justify-between border border-[var(--color-border-subtle)] rounded-lg p-3 bg-[var(--color-bg-soft)]">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Enabled by Default
                </span>
                <button
                  type="button"
                  onClick={() => setNewIsEnabled(!newIsEnabled)}
                  disabled={creating}
                  className="focus:outline-none cursor-pointer"
                >
                  {newIsEnabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-500 shrink-0" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-zinc-500 shrink-0" />
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Rollout Percentage
                  </span>
                  <span className="text-xs font-mono font-semibold text-[var(--color-accent)]">
                    {newRollout}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Percent className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newRollout}
                    onChange={(e) => setNewRollout(Number(e.target.value))}
                    disabled={creating}
                    className="flex-1 accent-[var(--color-accent)] cursor-pointer"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 font-medium cursor-pointer"
              >
                {creating ? 'Defining Flag...' : 'Create Flag'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
