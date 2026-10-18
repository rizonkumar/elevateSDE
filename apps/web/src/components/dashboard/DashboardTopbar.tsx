'use client';

import { usePathname } from 'next/navigation';
import { ShellTopbar } from '@elevatesde/ui';
import { useSessionRole } from '@/hooks/use-session-role';
import { buildRouteGroups, findActiveDashboardItem } from '@/lib/dashboard-nav';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';

interface DashboardTopbarProps {
  onOpenSidebar: () => void;
}

export function DashboardTopbar({ onOpenSidebar }: DashboardTopbarProps) {
  const pathname = usePathname();
  const role = useSessionRole();
  const match = findActiveDashboardItem(pathname, buildRouteGroups(role));
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
