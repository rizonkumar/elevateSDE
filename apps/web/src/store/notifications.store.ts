import { create } from 'zustand';
import type { NotificationDto, NotificationsViewDto, UnreadCountDto } from '@elevatesde/shared-types';
import { api } from '@/lib/api';

const POLL_INTERVAL_MS = 45000;

interface NotificationsState {
  notifications: NotificationDto[];
  unreadCount: number;
  isLoading: boolean;
  hasLoaded: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasLoaded: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<NotificationsViewDto>('/api/v1/notifications');
      set({
        notifications: response.data.notifications,
        unreadCount: response.data.unreadCount,
        isLoading: false,
        hasLoaded: true,
      });
    } catch {
      set({ isLoading: false, hasLoaded: true });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get<UnreadCountDto>('/api/v1/notifications/unread-count');
      set({ unreadCount: response.data.unreadCount });
    } catch {
      set((state) => state);
    }
  },

  markRead: async (id) => {
    const target = get().notifications.find((notification) => notification.id === id);
    if (!target || target.isRead) {
      return;
    }
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
    } catch {
      void get().fetchNotifications();
    }
  },

  markAllRead: async () => {
    if (get().unreadCount === 0) {
      return;
    }
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await api.post('/api/v1/notifications/read-all');
    } catch {
      void get().fetchNotifications();
    }
  },

  startPolling: () => {
    if (pollTimer !== null) {
      return;
    }
    void get().fetchUnreadCount();
    pollTimer = setInterval(() => {
      void get().fetchUnreadCount();
    }, POLL_INTERVAL_MS);
  },

  stopPolling: () => {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
}));
