'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShellSidebar, ShellTopbar } from '@elevatesde/ui';
import { ADMIN_NAV_GROUPS, findActiveAdminItem } from '../lib/admin-nav';
import { AdminBrandMark } from './AdminBrandMark';
import { AdminUserMenu } from './AdminUserMenu';
import { AdminCommandPalette } from './AdminCommandPalette';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const COLLAPSE_KEY = 'admin-sidebar-collapsed';

export function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

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
        groups={ADMIN_NAV_GROUPS}
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
