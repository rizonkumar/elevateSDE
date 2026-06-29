'use client';

import * as React from 'react';
import { Button, Tabs } from '@elevatesde/ui';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { NotificationItem } from '@/components/dashboard/NotificationItem';
import { useNotificationsStore } from '@/store/notifications.store';

type NotificationFilter = 'all' | 'unread';

export default function NotificationsPage() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const hasLoaded = useNotificationsStore((state) => state.hasLoaded);
  const fetchNotifications = useNotificationsStore((state) => state.fetchNotifications);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const [filter, setFilter] = React.useState<NotificationFilter>('all');

  React.useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const visible =
    filter === 'unread' ? notifications.filter((notification) => !notification.isRead) : notifications;

  const emptyLabel =
    filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.';

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Notifications"
          title="Your notifications"
          description="Badge unlocks, streak milestones, and community activity in one place."
          actions={
            unreadCount > 0 ? (
              <Button variant="secondary" onClick={() => void markAllRead()}>
                Mark all read
              </Button>
            ) : undefined
          }
        />

        <Tabs
          value={filter}
          onChange={(id) => setFilter(id as NotificationFilter)}
          items={[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
          ]}
        />

        <div className="overflow-hidden rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card)">
          {visible.length > 0 ? (
            <ul className="m-0 flex list-none flex-col divide-y divide-(--color-border-subtle) p-0">
              {visible.map((notification) => (
                <li key={notification.id}>
                  <NotificationItem notification={notification} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 px-4 py-12 text-center text-sm text-(--color-text-muted)">
              {hasLoaded ? emptyLabel : 'Loading…'}
            </p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
