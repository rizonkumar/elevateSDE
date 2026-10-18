import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  ToggleLeft,
  ShieldAlert,
  Trophy,
  Code2,
  CalendarDays,
  Swords,
  Medal,
  Map,
} from 'lucide-react';
import { findActiveNavItem } from '@elevatesde/ui';
import type { ActiveNavMatch, ShellNavGroupConfig, ShellNavItem } from '@elevatesde/ui';

export const ADMIN_ROOT = '/';

export const ADMIN_NAV_GROUPS: ShellNavGroupConfig[] = [
  {
    id: 'home',
    items: [
      {
        href: ADMIN_ROOT,
        label: 'Overview',
        icon: LayoutDashboard,
        keywords: ['dashboard', 'home', 'stats'],
      },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { href: '/users', label: 'Users', icon: Users, keywords: ['accounts', 'members', 'roles'] },
      { href: '/tenants', label: 'Tenants', icon: Building2, keywords: ['organizations', 'orgs'] },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      {
        href: '/coding-problems',
        label: 'Coding Problems',
        icon: Code2,
        keywords: ['questions', 'assessments'],
      },
      {
        href: '/daily-challenges',
        label: 'Daily Challenges',
        icon: CalendarDays,
        keywords: ['schedule'],
      },
      { href: '/contests', label: 'Contests', icon: Swords, keywords: ['competitions'] },
      {
        href: '/learning-paths',
        label: 'Learning Paths',
        icon: Map,
        keywords: ['prep tracks', 'roadmaps'],
      },
      { href: '/badges', label: 'Badges', icon: Medal, keywords: ['achievements'] },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    items: [
      {
        href: '/forum-moderation',
        label: 'Forum Moderation',
        icon: ShieldAlert,
        keywords: ['reports', 'posts', 'discussions'],
      },
      {
        href: '/leaderboard-management',
        label: 'Leaderboard',
        icon: Trophy,
        keywords: ['points', 'ranking'],
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        href: '/feature-flags',
        label: 'Feature Flags',
        icon: ToggleLeft,
        keywords: ['toggles', 'rollout'],
      },
      { href: '/audit-logs', label: 'Audit Logs', icon: FileText, keywords: ['history', 'events'] },
    ],
  },
];

export const WEB_APP_URL = `${process.env.NEXT_PUBLIC_WEB_URL ?? ''}/dashboard`;

export function findActiveAdminItem(pathname: string): ActiveNavMatch<ShellNavItem> | null {
  return findActiveNavItem(pathname, ADMIN_NAV_GROUPS, ADMIN_ROOT);
}
