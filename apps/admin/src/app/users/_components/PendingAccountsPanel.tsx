'use client';

import * as React from 'react';
import { Check, X, UserCheck } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import type { PendingAccountDto } from '@elevatesde/shared-types';
import { Badge } from '../../../components/ui';
import { approveAccount, rejectAccount } from '../../../lib/account-review-api';
import { formatRelativeTime } from '../../../lib/relative-time';
import { RejectAccountModal } from './RejectAccountModal';

interface PendingAccountsPanelProps {
  accounts: PendingAccountDto[];
  onReviewed: (account: PendingAccountDto, outcome: 'approved' | 'denied') => void;
  onError: (message: string) => void;
}

interface ApiErrorShape {
  response?: { data?: { message?: string } };
}

function errorMessage(error: unknown, fallback: string): string {
  return (error as ApiErrorShape).response?.data?.message ?? fallback;
}

function fullName(account: PendingAccountDto): string {
  const name = [account.firstName, account.lastName].filter(Boolean).join(' ');
  return name || 'No name provided';
}

function requestedRoleLabel(account: PendingAccountDto): string {
  return account.role === 'TENANT_ADMIN' ? 'Organization admin' : 'Candidate';
}

export function PendingAccountsPanel({
  accounts,
  onReviewed,
  onError,
}: Readonly<PendingAccountsPanelProps>) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [denyTarget, setDenyTarget] = React.useState<PendingAccountDto | null>(null);

  const approve = async (account: PendingAccountDto) => {
    setBusyId(account.id);
    try {
      await approveAccount(account.id);
      onReviewed(account, 'approved');
    } catch (error) {
      onError(errorMessage(error, 'Failed to approve this account.'));
    } finally {
      setBusyId(null);
    }
  };

  const deny = async (reason: string) => {
    if (!denyTarget) return;
    const account = denyTarget;
    setBusyId(account.id);
    try {
      await rejectAccount(account.id, reason);
      setDenyTarget(null);
      onReviewed(account, 'denied');
    } catch (error) {
      onError(errorMessage(error, 'Failed to deny this account.'));
    } finally {
      setBusyId(null);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-(--color-border-subtle) bg-(--color-surface) px-6 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-(--color-success-soft) text-(--color-success)">
          <UserCheck className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-(--color-text-primary)">
          You&apos;re all caught up
        </p>
        <p className="max-w-sm text-sm text-(--color-text-muted)">
          New sign-ups will appear here until you approve or deny them.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-(--color-border-subtle) rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm">
        {accounts.map((account) => {
          const busy = busyId === account.id;
          return (
            <li
              key={account.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-(--color-text-primary)">
                    {fullName(account)}
                  </span>
                  <Badge variant={account.role === 'TENANT_ADMIN' ? 'warning' : 'neutral'}>
                    {requestedRoleLabel(account)}
                  </Badge>
                  <Badge variant="neutral">
                    {account.signUpMethod === 'GOOGLE' ? 'Google' : 'Email'}
                  </Badge>
                </div>
                <span className="break-all text-sm text-(--color-text-muted)">{account.email}</span>
                <span className="text-xs text-(--color-text-disabled)">
                  {account.companyName ? `${account.companyName} · ` : ''}
                  Signed up {formatRelativeTime(account.createdAt)}
                </span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                  disabled={busy}
                  onClick={() => setDenyTarget(account)}
                >
                  <X className="h-4 w-4" />
                  Deny
                </Button>
                <Button
                  className="flex-1 sm:flex-none"
                  disabled={busy}
                  onClick={() => void approve(account)}
                >
                  <Check className="h-4 w-4" />
                  {busy ? 'Approving…' : 'Approve'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <RejectAccountModal
        email={denyTarget?.email ?? null}
        submitting={denyTarget !== null && busyId === denyTarget.id}
        onConfirm={(reason) => void deny(reason)}
        onClose={() => setDenyTarget(null)}
      />
    </>
  );
}
