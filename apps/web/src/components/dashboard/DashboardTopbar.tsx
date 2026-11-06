'use client';

import { usePathname } from 'next/navigation';
import { ShellTopbar } from '@elevatesde/ui';
import { useSessionHasTenant, useSessionRole } from '@/hooks/use-session-role';
import { buildRouteGroups, findActiveDashboardItem } from '@/lib/dashboard-nav';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';

interface DashboardTopbarProps {
  onOpenSidebar: () => void;
}

export function DashboardTopbar({ onOpenSidebar }: Readonly<DashboardTopbarProps>) {
  const pathname = usePathname();
  const role = useSessionRole();
  const hasTenant = useSessionHasTenant();
  const match = findActiveDashboardItem(pathname, buildRouteGroups({ role, hasTenant }));
  const breadcrumb = match ? { group: match.group.label, page: match.item.label } : null;

  return (
    <ShellTopbar
      breadcrumb={breadcrumb}
      onOpenSidebar={onOpenSidebar}
      actions={
        <>
          <NotificationBell />
          <UserMenu />
        </>
      }
    />
  );
}
