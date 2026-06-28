'use client';

import * as React from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { Button, ConfirmDialog } from '@elevatesde/ui';
import { AdminLayout } from '../../components/AdminLayout';
import { useBadgesStore } from '../../store/badges.store';
import { BadgeDirectory } from './_components/BadgeDirectory';
import { BadgeFormModal } from './_components/BadgeFormModal';
import { GrantBadgeModal } from './_components/GrantBadgeModal';

export default function BadgesPage() {
  const badges = useBadgesStore((state) => state.badges);
  const loading = useBadgesStore((state) => state.loading);
  const togglingId = useBadgesStore((state) => state.togglingId);
  const pendingDeleteId = useBadgesStore((state) => state.pendingDeleteId);
  const deletingId = useBadgesStore((state) => state.deletingId);
  const loadBadges = useBadgesStore((state) => state.loadBadges);
  const openCreate = useBadgesStore((state) => state.openCreate);
  const openEdit = useBadgesStore((state) => state.openEdit);
  const toggleActive = useBadgesStore((state) => state.toggleActive);
  const requestDelete = useBadgesStore((state) => state.requestDelete);
  const cancelDelete = useBadgesStore((state) => state.cancelDelete);
  const confirmDelete = useBadgesStore((state) => state.confirmDelete);
  const openGrant = useBadgesStore((state) => state.openGrant);

  React.useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const showInitialLoader = loading && badges.length === 0;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-(--color-text-muted)">
            Define achievement badges and grant or revoke them for candidates.
          </p>
          <span className="text-xs font-semibold text-(--color-text-muted) px-2.5 py-1 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg)">
            {badges.length} badges
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="secondary" onClick={openGrant}>
            <UserPlus className="w-4 h-4 shrink-0" />
            Manual grant
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="w-4 h-4 shrink-0" />
            New badge
          </Button>
        </div>

        {showInitialLoader ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <span className="text-sm text-(--color-text-muted) animate-pulse">
              Retrieving badges...
            </span>
          </div>
        ) : (
          <BadgeDirectory
            badges={badges}
            togglingId={togglingId}
            onEdit={openEdit}
            onDelete={requestDelete}
            onToggleActive={toggleActive}
          />
        )}
      </div>

      <BadgeFormModal />
      <GrantBadgeModal />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete badge"
        description="This permanently removes the badge and revokes it from every user. This action cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </AdminLayout>
  );
}
