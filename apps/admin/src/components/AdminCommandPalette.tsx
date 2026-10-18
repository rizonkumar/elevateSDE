'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppWindow, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { CommandPalette, useTheme } from '@elevatesde/ui';
import type { CommandSection } from '@elevatesde/ui';
import { ADMIN_NAV_GROUPS, WEB_APP_URL } from '../lib/admin-nav';
import { useAdminSignOut } from './AdminUserMenu';

export function AdminCommandPalette() {
  const router = useRouter();
  const { setPreference } = useTheme();
  const handleSignOut = useAdminSignOut();

  const sections = React.useMemo<CommandSection[]>(() => {
    const pages: CommandSection[] = ADMIN_NAV_GROUPS.map((group) => ({
      id: group.id,
      label: group.label ?? 'Go to',
      items: group.items.map((item) => ({
        id: item.href,
        label: item.label,
        icon: item.icon,
        keywords: item.keywords,
        onSelect: () => router.push(item.href),
      })),
    }));

    const actions: CommandSection = {
      id: 'actions',
      label: 'Actions',
      items: [
        {
          id: 'open-app',
          label: 'Open ElevateSDE',
          icon: AppWindow,
          keywords: ['web', 'dashboard', 'app'],
          onSelect: () => window.location.assign(WEB_APP_URL),
        },
        {
          id: 'theme-light',
          label: 'Use light theme',
          icon: Sun,
          keywords: ['appearance', 'mode'],
          onSelect: () => setPreference('light'),
        },
        {
          id: 'theme-dark',
          label: 'Use dark theme',
          icon: Moon,
          keywords: ['appearance', 'mode'],
          onSelect: () => setPreference('dark'),
        },
        {
          id: 'theme-system',
          label: 'Use system theme',
          icon: Monitor,
          keywords: ['appearance', 'mode', 'auto'],
          onSelect: () => setPreference('system'),
        },
        {
          id: 'sign-out',
          label: 'Sign out',
          icon: LogOut,
          keywords: ['logout', 'log out'],
          onSelect: () => void handleSignOut(),
        },
      ],
    };

    return [...pages, actions];
  }, [router, setPreference, handleSignOut]);

  return <CommandPalette sections={sections} />;
}
