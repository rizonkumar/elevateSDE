'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShellSidebar, ShellTopbar } from '@elevatesde/ui';
import { ADMIN_NAV_GROUPS, findActiveAdminItem } from '../lib/admin-nav';
import { AdminBrandMark } from './AdminBrandMark';
import { AdminUserMenu } from './AdminUserMenu';
import { AdminCommandPalette } from './AdminCommandPalette';
import { usePendingAccountsStore } from '../store/pending-accounts.store';
import type { ShellNavGroupConfig } from '@elevatesde/ui';

const USERS_HREF = '/users';

function withPendingBadge(groups: ShellNavGroupConfig[], count: number): ShellNavGroupConfig[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.href === USERS_HREF ? { ...item, badgeCount: count } : item,
    ),
  }));
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const COLLAPSE_KEY = 'admin-sidebar-collapsed';

export function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const pendingCount = usePendingAccountsStore((state) => state.count);
  const refreshPendingCount = usePendingAccountsStore((state) => state.refreshCountIfStale);
  const navGroups = React.useMemo(
    () => withPendingBadge(ADMIN_NAV_GROUPS, pendingCount),
    [pendingCount],
  );

  React.useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const closeSidebar = React.useCallback(() => setSidebarOpen(false), []);
  const match = findActiveAdminItem(pathname);
  const breadcrumb = match
    ? { group: match.group.label, page: match.item.label }
    : { page: 'Backoffice' };

  return (
    <div className="flex min-h-screen bg-(--color-bg) text-(--color-text-primary)">
      <ShellSidebar
        groups={navGroups}
        activeHref={match?.item.href ?? null}
        renderBrand={(compact) => <AdminBrandMark compact={compact} />}
        LinkComponent={Link}
        collapseStorageKey={COLLAPSE_KEY}
        open={sidebarOpen}
        onClose={closeSidebar}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellTopbar
          breadcrumb={breadcrumb}
          onOpenSidebar={() => setSidebarOpen(true)}
          actions={<AdminUserMenu />}
        />
        <main className="flex-1 bg-(--color-bg-soft) p-4 sm:p-8">{children}</main>
      </div>
      <AdminCommandPalette />
    </div>
  );
}
