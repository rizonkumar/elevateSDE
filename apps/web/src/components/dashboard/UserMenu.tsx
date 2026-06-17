'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { getDisplayName, getInitial } from '@/lib/user-display';

export function UserMenu() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!mounted || !isAuthenticated || !user) return null;

  const handleLogout = async () => {
    try {
      const Cookies = (await import('js-cookie')).default;
      const token = Cookies.get('refreshToken');
      if (token) {
        await api.post('/api/v1/auth/logout', { refreshToken: token });
      }
    } catch {
      clearAuth();
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const name = getDisplayName(user);
  const initial = getInitial(user);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-(--color-border-subtle) py-1 pl-1 pr-2.5 transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-accent) text-sm font-semibold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-(--color-text-primary) sm:block">
          {name}
        </span>
        <ChevronDown
          className={`hidden h-4 w-4 text-(--color-text-muted) transition-transform sm:block ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-soft)"
        >
          <div className="flex items-center gap-3 border-b border-(--color-border-subtle) px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-base font-semibold text-white">
              {initial}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-semibold text-(--color-text-primary)">
                {name}
              </span>
              <span className="truncate text-xs text-(--color-text-muted)">{user.email}</span>
              <Badge variant="accent" className="mt-0.5 self-start">
                {user.role}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
