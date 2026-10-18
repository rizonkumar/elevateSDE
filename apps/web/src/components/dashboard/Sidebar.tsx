'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShellSidebar } from '@elevatesde/ui';
import { useSessionRole } from '@/hooks/use-session-role';
import { useReviewStore } from '@/store/review.store';
import { buildNavGroups, findActiveDashboardItem } from '@/lib/dashboard-nav';
import type { NavGroup } from '@/lib/dashboard-nav';
import { BrandMark } from './BrandMark';

const COLLAPSE_KEY = 'web-sidebar-collapsed';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const role = useSessionRole();
  const dueReviewCount = useReviewStore((state) => state.summary?.dueCount ?? 0);
  const loadReviewSummary = useReviewStore((state) => state.loadSummary);

  React.useEffect(() => {
    void loadReviewSummary();
  }, [loadReviewSummary]);

  const groups = React.useMemo<NavGroup[]>(
    () =>
      buildNavGroups(role).map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.badge === 'review' ? { ...item, badgeCount: dueReviewCount } : item,
        ),
      })),
    [role, dueReviewCount],
  );

  const activeHref = findActiveDashboardItem(pathname, groups)?.item.href ?? null;

  return (
    <ShellSidebar
      groups={groups}
      activeHref={activeHref}
      renderBrand={(compact) => <BrandMark compact={compact} />}
      LinkComponent={Link}
      collapseStorageKey={COLLAPSE_KEY}
      open={open}
      onClose={onClose}
    />
  );
}
