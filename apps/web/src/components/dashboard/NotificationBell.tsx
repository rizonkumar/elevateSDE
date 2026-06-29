'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotificationsStore } from '@/store/notifications.store';
import { NotificationItem } from './NotificationItem';

const PREVIEW_COUNT = 6;

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const hasLoaded = useNotificationsStore((state) => state.hasLoaded);
  const fetchNotifications = useNotificationsStore((state) => state.fetchNotifications);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const startPolling = useNotificationsStore((state) => state.startPolling);
  const stopPolling = useNotificationsStore((state) => state.stopPolling);

  React.useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  React.useEffect(() => {
    if (!open) return;
    void fetchNotifications();
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
  }, [open, fetchNotifications]);

  const preview = notifications.slice(0, PREVIEW_COUNT);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative rounded-full border border-(--color-border-subtle) p-2 text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-danger) px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-soft)"
        >
          <div className="flex items-center justify-between border-b border-(--color-border-subtle) px-4 py-3">
            <span className="text-sm font-semibold text-(--color-text-primary)">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-(--color-accent) transition-opacity hover:opacity-80 cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 divide-y divide-(--color-border-subtle) overflow-y-auto">
            {preview.length > 0 ? (
              preview.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onSelect={() => setOpen(false)}
                />
              ))
            ) : (
              <p className="m-0 px-4 py-8 text-center text-sm text-(--color-text-muted)">
                {hasLoaded ? 'You are all caught up.' : 'Loading…'}
              </p>
            )}
          </div>
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-(--color-border-subtle) px-4 py-3 text-center text-sm font-medium text-(--color-accent) transition-colors hover:bg-(--color-badge-bg)"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
