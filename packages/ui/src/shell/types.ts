import type * as React from 'react';

export type ShellIcon = React.ComponentType<{ className?: string }>;

export interface ShellNavItem {
  href: string;
  label: string;
  icon: ShellIcon;
  keywords?: string[];
  external?: boolean;
  badgeCount?: number;
}

export interface ShellNavGroupConfig<TItem extends ShellNavItem = ShellNavItem> {
  id: string;
  label?: string;
  items: TItem[];
}

export interface ShellLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
  'aria-current'?: 'page';
  'aria-label'?: string;
}

export type ShellLinkComponent = React.ComponentType<ShellLinkProps>;

export interface ShellBreadcrumb {
  group?: string;
  page: string;
}
