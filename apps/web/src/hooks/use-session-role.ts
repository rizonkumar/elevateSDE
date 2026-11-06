import * as React from 'react';
import { useAuthStore } from '@/store/auth.store';

const subscribeNoop = () => () => undefined;

export function useSessionRole(): string | undefined {
  const hydrated = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const role = useAuthStore((state) => state.user?.role);
  return hydrated ? role : undefined;
}

export function useSessionHasTenant(): boolean {
  const hydrated = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? null);
  return hydrated && tenantId !== null;
}

export type SessionTenantStatus = 'pending' | 'tenant' | 'none';

export function useSessionTenantStatus(): SessionTenantStatus {
  const hydrated = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const user = useAuthStore((state) => state.user);
  if (!hydrated || !user) {
    return 'pending';
  }
  return user.tenantId ? 'tenant' : 'none';
}
