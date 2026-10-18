'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, AppWindow } from 'lucide-react';
import {
  AppearanceSwitch,
  ShellAccountMenu,
  ShellMenuItem,
  ShellMenuSection,
  ShellMenuSeparator,
} from '@elevatesde/ui';
import { useAuthStore } from '../store/auth.store';
import { useToastStore } from '../store/toast.store';
import { signOut } from '../lib/api';
import { WEB_APP_URL } from '../lib/admin-nav';

export function useAdminSignOut() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  return React.useCallback(async () => {
    await signOut();
    addToast('Logged out successfully.', 'success');
    router.push('/login');
  }, [router, addToast]);
}

function displayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string,
) {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  return full || email.split('@')[0] || email;
}

export function AdminUserMenu() {
  const user = useAuthStore((state) => state.user);
  const handleSignOut = useAdminSignOut();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return <span aria-hidden="true" className="block h-9 w-9" />;
  }

  const name = displayName(user.firstName, user.lastName, user.email);

  return (
    <ShellAccountMenu
      name={name}
      email={user.email}
      initial={name.charAt(0).toUpperCase() || 'A'}
      roleLabel="Admin"
    >
      <ShellMenuSeparator />
      <ShellMenuSection>
        <ShellMenuItem label="Open ElevateSDE" icon={AppWindow} href={WEB_APP_URL} external />
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
