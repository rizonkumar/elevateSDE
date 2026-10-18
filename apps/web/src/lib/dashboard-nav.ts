import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Mic2,
  Code2,
  MessagesSquare,
  Trophy,
  Building2,
  Flame,
  Award,
  Bell,
  ListChecks,
  Route,
  Swords,
  Repeat,
  UserRound,
  Target,
  Shield,
} from 'lucide-react';
import { findActiveNavItem } from '@elevatesde/ui';
import type { ActiveNavMatch, ShellNavGroupConfig, ShellNavItem } from '@elevatesde/ui';

export const DASHBOARD_ROOT = '/dashboard';

export type NavBadgeKind = 'review';

export interface DashboardNavItem extends ShellNavItem {
  badge?: NavBadgeKind;
}

export type NavGroup = ShellNavGroupConfig<DashboardNavItem>;

const HOME_GROUP: NavGroup = {
  id: 'home',
  items: [
    {
      href: DASHBOARD_ROOT,
      label: 'Dashboard',
      icon: LayoutDashboard,
      keywords: ['home', 'overview'],
    },
  ],
};

const PRACTICE_GROUP: NavGroup = {
  id: 'practice',
  label: 'Practice',
  items: [
    {
      href: '/dashboard/daily',
      label: 'Daily Challenge',
      icon: Flame,
      keywords: ['streak', 'today'],
    },
    {
      href: '/dashboard/assessment',
      label: 'Problems',
      icon: Code2,
      keywords: ['code editor', 'assessment', 'coding', 'questions'],
    },
    {
      href: '/dashboard/review',
      label: 'Review',
      icon: Repeat,
      keywords: ['spaced repetition', 'revise', 'due'],
      badge: 'review',
    },
    {
      href: '/dashboard/paths',
      label: 'Prep Tracks',
      icon: Route,
      keywords: ['learning paths', 'roadmap'],
    },
    {
      href: '/dashboard/lists',
      label: 'My Lists',
      icon: ListChecks,
      keywords: ['saved', 'bookmarks', 'collections'],
    },
  ],
};

const CAREER_GROUP: NavGroup = {
  id: 'career',
  label: 'Career',
  items: [
    {
      href: '/dashboard/interview-readiness',
      label: 'Interview Readiness',
      icon: Target,
      keywords: ['company prep', 'peer interview'],
    },
    {
      href: '/dashboard/mock-interview',
      label: 'Mock Interview',
      icon: Mic2,
      keywords: ['ai interview', 'practice interview'],
    },
    {
      href: '/dashboard/resume',
      label: 'Resume Analyzer',
      icon: FileText,
      keywords: ['cv', 'ats'],
    },
    {
      href: '/dashboard/job-tracker',
      label: 'Job Tracker',
      icon: Briefcase,
      keywords: ['applications', 'jobs', 'pipeline'],
    },
  ],
};

const COMMUNITY_GROUP: NavGroup = {
  id: 'community',
  label: 'Community',
  items: [
    {
      href: '/dashboard/contests',
      label: 'Contests',
      icon: Swords,
      keywords: ['competition', 'compete'],
    },
    {
      href: '/dashboard/leaderboard',
      label: 'Leaderboard',
      icon: Trophy,
      keywords: ['ranking', 'points'],
    },
    {
      href: '/dashboard/forum',
      label: 'Discussions',
      icon: MessagesSquare,
      keywords: ['forum', 'community', 'posts'],
    },
    {
      href: '/dashboard/achievements',
      label: 'Achievements',
      icon: Award,
      keywords: ['badges'],
    },
  ],
};

const ORGANIZATION_ITEM: DashboardNavItem = {
  href: '/dashboard/org',
  label: 'Organization',
  icon: Building2,
  keywords: ['tenant', 'team', 'members'],
};

const ADMIN_CONSOLE_ITEM: DashboardNavItem = {
  href: '/admin',
  label: 'Admin Console',
  icon: Shield,
  keywords: ['backoffice', 'admin'],
  external: true,
};

const ACCOUNT_GROUP: NavGroup = {
  id: 'account',
  label: 'Account',
  items: [
    {
      href: '/dashboard/profile',
      label: 'Profile',
      icon: UserRound,
      keywords: ['account', 'settings', 'me'],
    },
    {
      href: '/dashboard/notifications',
      label: 'Notifications',
      icon: Bell,
      keywords: ['inbox', 'alerts'],
    },
  ],
};

function buildManageItems(role?: string): DashboardNavItem[] {
  const items: DashboardNavItem[] = [];
  if (role === 'TENANT_ADMIN') items.push(ORGANIZATION_ITEM);
  if (role === 'ADMIN') items.push(ADMIN_CONSOLE_ITEM);
  return items;
}

export function buildNavGroups(role?: string): NavGroup[] {
  const groups = [HOME_GROUP, PRACTICE_GROUP, CAREER_GROUP, COMMUNITY_GROUP];
  const manageItems = buildManageItems(role);
  if (manageItems.length > 0) {
    groups.push({ id: 'manage', label: 'Manage', items: manageItems });
  }
  return groups;
}

export function buildRouteGroups(role?: string): NavGroup[] {
  return [...buildNavGroups(role), ACCOUNT_GROUP];
}

export function findActiveDashboardItem(
  pathname: string,
  groups: NavGroup[],
): ActiveNavMatch<DashboardNavItem> | null {
  return findActiveNavItem(pathname, groups, DASHBOARD_ROOT);
}
