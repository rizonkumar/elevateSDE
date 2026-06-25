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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const BASE_LINKS: DashboardNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/job-tracker', label: 'Job Tracker', icon: Briefcase },
  { href: '/dashboard/resume', label: 'Resume Analyzer', icon: FileText },
  { href: '/dashboard/mock-interview', label: 'Mock Interview', icon: Mic2 },
  { href: '/dashboard/assessment', label: 'Code Editor', icon: Code2 },
  { href: '/dashboard/daily', label: 'Daily Challenge', icon: Flame },
  { href: '/dashboard/forum', label: 'Community', icon: MessagesSquare },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export function buildNavLinks(role?: string): DashboardNavItem[] {
  const links = [...BASE_LINKS];
  if (role === 'TENANT_ADMIN') {
    links.push({ href: '/dashboard/org', label: 'Organization', icon: Building2 });
  }
  return links;
}

export function isNavItemActive(href: string, pathname: string): boolean {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
}
