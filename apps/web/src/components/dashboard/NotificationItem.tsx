'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Award, Bell, CheckCircle2, Flame, MessageSquare, ThumbsUp } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { BadgeVariant } from '@elevatesde/ui';
import type { NotificationDto, NotificationType } from '@elevatesde/shared-types';
import { formatRelativeTime } from '@/lib/relative-time';
import { useNotificationsStore } from '@/store/notifications.store';

type IconComponent = React.ComponentType<{ className?: string }>;

interface NotificationTypeMeta {
  icon: IconComponent;
  label: string;
  variant: BadgeVariant;
}

const TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  BADGE_AWARDED: { icon: Award, label: 'Achievement', variant: 'success' },
  STREAK_MILESTONE: { icon: Flame, label: 'Streak', variant: 'warning' },
  FORUM_REPLY: { icon: MessageSquare, label: 'Reply', variant: 'accent' },
  FORUM_UPVOTE: { icon: ThumbsUp, label: 'Upvote', variant: 'accent' },
  SUBMISSION_ACCEPTED: { icon: CheckCircle2, label: 'Accepted', variant: 'success' },
  SYSTEM: { icon: Bell, label: 'System', variant: 'neutral' },
};

interface NotificationItemProps {
  notification: NotificationDto;
  onSelect?: () => void;
}

export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const router = useRouter();
  const markRead = useNotificationsStore((state) => state.markRead);
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;

  const handleClick = () => {
    void markRead(notification.id);
    onSelect?.();
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-(--color-text-primary)">
            {notification.title}
          </span>
          {!notification.isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-(--color-accent)" aria-label="Unread" />
          )}
        </span>
        <span className="line-clamp-2 text-xs text-(--color-text-muted)">{notification.body}</span>
        <span className="mt-0.5 flex items-center gap-2">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <span className="text-[11px] text-(--color-text-muted)">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </span>
      </span>
    </button>
  );
}
