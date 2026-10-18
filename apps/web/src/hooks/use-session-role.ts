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
