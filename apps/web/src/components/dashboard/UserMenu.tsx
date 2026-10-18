'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Shield, UserRound } from 'lucide-react';
import {
  AppearanceSwitch,
  ShellAccountMenu,
  ShellMenuItem,
  ShellMenuSection,
  ShellMenuSeparator,
} from '@elevatesde/ui';
import { useAuthStore } from '@/store/auth.store';
import { signOut } from '@/lib/api';
import { getDisplayName, getInitial, getRoleLabel } from '@/lib/user-display';

export function UserMenu() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated || !user) {
    return <span aria-hidden="true" className="block h-9 w-9" />;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <ShellAccountMenu
      name={getDisplayName(user)}
      email={user.email}
      initial={getInitial(user)}
      roleLabel={getRoleLabel(user.role)}
    >
      <ShellMenuSeparator />
      <ShellMenuSection>
        <ShellMenuItem
          label="Profile"
          icon={UserRound}
          href="/dashboard/profile"
          LinkComponent={Link}
        />
        <ShellMenuItem
          label="Notifications"
          icon={Bell}
          href="/dashboard/notifications"
          LinkComponent={Link}
        />
        {user.role === 'ADMIN' && (
          <ShellMenuItem label="Admin Console" icon={Shield} href="/admin" external />
        )}
      </ShellMenuSection>
      <ShellMenuSeparator />
      <AppearanceSwitch />
      <ShellMenuSeparator />
      <ShellMenuSection>
        <ShellMenuItem
          label="Sign out"
          icon={LogOut}
          tone="danger"
          onSelect={() => void handleSignOut()}
        />
      </ShellMenuSection>
    </ShellAccountMenu>
  );
}
