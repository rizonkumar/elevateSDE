'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { api } from '../../lib/api';
import { useToastStore } from '../../store/toast.store';
import { AuditLogDto } from '@elevatesde/shared-types';

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function AuditLogsPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [logs, setLogs] = React.useState<AuditLogDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadAuditLogs() {
      try {
        const res = await api.get<AuditLogDto[]>('/api/v1/admin/audit-logs');
        setLogs(res.data);
      } catch (err) {
        const axiosError = err as AxiosErrorResponse;
        addToast(axiosError.response?.data?.message || 'Failed to retrieve audit logs.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadAuditLogs();
  }, [addToast]);

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-[var(--color-text-muted)] animate-pulse">
            Loading system audit records...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Executor ID</th>
                  <th className="px-6 py-4">Event Metadata</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-xs text-[var(--color-text-muted)]"
                    >
                      No system events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[var(--color-bg-soft)]/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold tracking-wider text-[var(--color-text-primary)]">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)]">
                        {log.userId || 'system'}
                      </td>
                      <td className="px-6 py-4">
                        {log.metadata ? (
                          <pre className="text-[10px] bg-[var(--color-bg-soft)] p-2.5 rounded border border-[var(--color-border-subtle)] font-mono text-[var(--color-text-muted)] max-w-md overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--color-text-muted)] font-mono">
                        {new Date(log.createdAt).toLocaleString()}
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
