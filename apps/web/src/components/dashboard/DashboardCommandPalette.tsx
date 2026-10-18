'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { CommandPalette, useTheme } from '@elevatesde/ui';
import type { CommandSection } from '@elevatesde/ui';
import { useSessionRole } from '@/hooks/use-session-role';
import { signOut } from '@/lib/api';
import { buildRouteGroups } from '@/lib/dashboard-nav';

export function DashboardCommandPalette() {
  const router = useRouter();
  const role = useSessionRole();
  const { setPreference } = useTheme();

  const sections = React.useMemo<CommandSection[]>(() => {
    const pages: CommandSection[] = buildRouteGroups(role).map((group) => ({
      id: group.id,
      label: group.label ?? 'Go to',
      items: group.items.map((item) => ({
        id: item.href,
        label: item.label,
        icon: item.icon,
        keywords: item.keywords,
        hint: item.external ? 'Opens console' : undefined,
        onSelect: () => {
          if (item.external) {
            window.location.assign(item.href);
          } else {
            router.push(item.href);
          }
        },
      })),
    }));

    const actions: CommandSection = {
      id: 'actions',
      label: 'Actions',
      items: [
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
          onSelect: () => {
            void signOut().then(() => router.push('/login'));
          },
        },
      ],
    };

    return [...pages, actions];
  }, [role, router, setPreference]);

  return <CommandPalette sections={sections} />;
}
