'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Badge, RangeSlider, Toggle } from '../../components/ui';
import { api } from '../../lib/api';
import { useToastStore } from '../../store/toast.store';
import { Button, Input } from '@elevatesde/ui';
import { FeatureFlagDto } from '@elevatesde/shared-types';
import { Plus, Percent, Settings } from 'lucide-react';

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

  const handleCreate = async (e: React.SyntheticEvent) => {
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
        <div className="flex min-h-[300px] items-center justify-center">
          <span className="animate-pulse text-sm text-(--color-text-muted)">
            Retrieving system feature flags...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="hidden overflow-x-auto rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                    <th className="px-6 py-4">Flag Key</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Rollout %</th>
                    <th className="px-6 py-4">Updated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border-subtle)">
                  {flags.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-xs text-(--color-text-muted)"
                      >
                        No feature flags defined yet.
                      </td>
                    </tr>
                  ) : (
                    flags.map((flag) => (
                      <tr key={flag.id} className="transition-colors hover:bg-(--color-bg-soft)/50">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-(--color-text-primary)">
                          {flag.flagKey}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Toggle
                              checked={flag.isEnabled}
                              disabled={updatingId === flag.id}
                              label={`Toggle ${flag.flagKey}`}
                              onChange={() => handleToggle(flag.id, flag.isEnabled)}
                            />
                            <Badge
                              variant={flag.isEnabled ? 'success' : 'neutral'}
                              className="min-w-[92px] justify-center"
                            >
                              {flag.isEnabled ? 'Active' : 'Disabled'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <RangeSlider
                              value={flag.percentageRollout}
                              disabled={updatingId === flag.id}
                              onCommit={(value) => handleRolloutChange(flag.id, value)}
                              className="w-32"
                            />
                            <span className="w-9 text-right font-mono text-xs font-semibold text-(--color-text-primary)">
                              {flag.percentageRollout}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-(--color-text-muted)">
                          {new Date(flag.updatedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 md:hidden">
              {flags.length === 0 ? (
                <div className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) px-6 py-10 text-center text-xs text-(--color-text-muted) shadow-sm">
                  No feature flags defined yet.
                </div>
              ) : (
                flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="flex flex-col gap-3 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs font-bold break-all text-(--color-text-primary)">
                        {flag.flagKey}
                      </span>
                      <Badge variant={flag.isEnabled ? 'success' : 'neutral'}>
                        {flag.isEnabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Toggle
                        checked={flag.isEnabled}
                        disabled={updatingId === flag.id}
                        label={`Toggle ${flag.flagKey}`}
                        onChange={() => handleToggle(flag.id, flag.isEnabled)}
                      />
                      <div className="flex flex-1 items-center justify-end gap-3">
                        <RangeSlider
                          value={flag.percentageRollout}
                          disabled={updatingId === flag.id}
                          onCommit={(value) => handleRolloutChange(flag.id, value)}
                          className="w-32"
                        />
                        <span className="w-9 text-right font-mono text-xs font-semibold text-(--color-text-primary)">
                          {flag.percentageRollout}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-sm">
            <h2 className="flex items-center gap-2 border-b border-(--color-border-subtle) pb-4 text-sm font-semibold text-(--color-text-primary)">
              <Plus className="h-4 w-4 shrink-0 text-(--color-accent)" />
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
                icon={<Settings className="h-4 w-4 text-(--color-text-muted)" />}
              />

              <div className="flex items-center justify-between rounded-lg border border-(--color-border-subtle) bg-(--color-bg-soft) p-3">
                <span className="text-xs font-semibold text-(--color-text-primary)">
                  Enabled by Default
                </span>
                <Toggle
                  checked={newIsEnabled}
                  disabled={creating}
                  label="Enabled by default"
                  onChange={setNewIsEnabled}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-(--color-text-primary)">
                    Rollout Percentage
                  </span>
                  <span className="font-mono text-xs font-semibold text-(--color-accent)">
                    {newRollout}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Percent className="h-4 w-4 shrink-0 text-(--color-text-muted)" />
                  <RangeSlider
                    value={newRollout}
                    onChange={setNewRollout}
                    disabled={creating}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={creating}
                className="w-full cursor-pointer py-2.5 font-medium"
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
