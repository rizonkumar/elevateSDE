'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { DashboardCommandPalette } from '@/components/dashboard/DashboardCommandPalette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const closeSidebar = React.useCallback(() => setOpen(false), []);
  const isImmersive = /^\/dashboard\/assessment\/[^/]+$/.test(pathname);

  return (
    <div className="flex min-h-screen bg-(--color-bg) text-(--color-text-primary)">
      <Sidebar open={open} onClose={closeSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        {!isImmersive && <DashboardTopbar onOpenSidebar={() => setOpen(true)} />}
        <main className="flex-1">{children}</main>
      </div>
      <DashboardCommandPalette />
    </div>
  );
}
