import { create } from 'zustand';
import type {
  AdminBadgeDto,
  BadgeCriteriaType,
  CreateBadgeDto,
  UserDto,
} from '@elevatesde/shared-types';
import {
  createBadge as createBadgeRequest,
  deleteBadge as deleteBadgeRequest,
  fetchBadges,
  fetchUsers,
  grantBadge as grantBadgeRequest,
  revokeBadge as revokeBadgeRequest,
  updateBadge as updateBadgeRequest,
} from '../lib/badges-api';
import { useToastStore } from './toast.store';

export interface BadgeFormValues {
  key: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: BadgeCriteriaType;
  threshold: number;
  isActive: boolean;
}

interface BadgesState {
  badges: AdminBadgeDto[];
  users: UserDto[];
  loading: boolean;
  isModalOpen: boolean;
  editing: AdminBadgeDto | null;
  isGrantOpen: boolean;
  granting: boolean;
  savingId: string | null;
  togglingId: string | null;
  deletingId: string | null;
  pendingDeleteId: string | null;
  loadBadges: () => Promise<void>;
  loadUsers: () => Promise<void>;
  openCreate: () => void;
  openEdit: (id: string) => void;
  closeModal: () => void;
  saveBadge: (values: BadgeFormValues) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
  openGrant: () => void;
  closeGrant: () => void;
  grant: (userId: string, badgeId: string) => Promise<void>;
  revoke: (userId: string, badgeId: string) => Promise<void>;
}

interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
}

const errorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosErrorResponse;
  return axiosError.response?.data?.message ?? fallback;
};

const notify = (message: string, type: 'success' | 'error') =>
  useToastStore.getState().addToast(message, type);

const toInput = (values: BadgeFormValues): CreateBadgeDto => ({
  key: values.key.trim(),
  name: values.name.trim(),
  description: values.description.trim(),
  icon: values.icon.trim(),
  criteriaType: values.criteriaType,
  threshold: values.threshold,
  isActive: values.isActive,
});

const fromBadge = (badge: AdminBadgeDto): CreateBadgeDto => ({
  key: badge.key,
  name: badge.name,
  description: badge.description,
  icon: badge.icon,
  criteriaType: badge.criteriaType,
  threshold: badge.threshold,
  isActive: badge.isActive,
});

const upsert = (list: AdminBadgeDto[], badge: AdminBadgeDto): AdminBadgeDto[] => {
  const exists = list.some((item) => item.id === badge.id);
  return exists ? list.map((item) => (item.id === badge.id ? badge : item)) : [badge, ...list];
};

export const useBadgesStore = create<BadgesState>((set, get) => ({
  badges: [],
  users: [],
  loading: true,
  isModalOpen: false,
  editing: null,
  isGrantOpen: false,
  granting: false,
  savingId: null,
  togglingId: null,
  deletingId: null,
  pendingDeleteId: null,

  loadBadges: async () => {
    set({ loading: true });
    try {
      const badges = await fetchBadges();
      set({ badges, loading: false });
    } catch (error) {
      set({ loading: false });
      notify(errorMessage(error, 'Failed to retrieve badges.'), 'error');
    }
  },

  loadUsers: async () => {
    if (get().users.length > 0) {
      return;
    }
    try {
      const users = await fetchUsers();
      set({ users });
    } catch (error) {
      notify(errorMessage(error, 'Failed to load users.'), 'error');
    }
  },

  openCreate: () => set({ isModalOpen: true, editing: null }),
  openEdit: (id) => {
    const editing = get().badges.find((badge) => badge.id === id) ?? null;
    set({ isModalOpen: true, editing });
  },
  closeModal: () => set({ isModalOpen: false, editing: null }),

  saveBadge: async (values) => {
    const editing = get().editing;
    set({ savingId: editing ? editing.id : 'new' });
    try {
      const input = toInput(values);
      if (editing) {
        const saved = await updateBadgeRequest(editing.id, input);
        set((state) => ({
          badges: upsert(state.badges, saved),
          savingId: null,
          isModalOpen: false,
          editing: null,
        }));
        notify('Badge updated.', 'success');
        return;
      }
      const created = await createBadgeRequest(input);
      set((state) => ({
        badges: upsert(state.badges, created),
        savingId: null,
        isModalOpen: false,
        editing: null,
      }));
      notify('Badge created.', 'success');
    } catch (error) {
      set({ savingId: null });
      notify(errorMessage(error, 'Failed to save badge.'), 'error');
    }
  },

  toggleActive: async (id) => {
    const target = get().badges.find((badge) => badge.id === id);
    if (!target) {
      return;
    }
    set({ togglingId: id });
    try {
      const saved = await updateBadgeRequest(id, { ...fromBadge(target), isActive: !target.isActive });
      set((state) => ({ badges: upsert(state.badges, saved), togglingId: null }));
      notify(saved.isActive ? 'Badge activated.' : 'Badge deactivated.', 'success');
    } catch (error) {
      set({ togglingId: null });
      notify(errorMessage(error, 'Failed to update badge.'), 'error');
    }
  },

  requestDelete: (id) => set({ pendingDeleteId: id }),
  cancelDelete: () => set({ pendingDeleteId: null }),

  confirmDelete: async () => {
    const id = get().pendingDeleteId;
    if (!id) {
      return;
    }
    set({ deletingId: id });
    try {
      await deleteBadgeRequest(id);
      set((state) => ({
        badges: state.badges.filter((badge) => badge.id !== id),
        deletingId: null,
        pendingDeleteId: null,
      }));
      notify('Badge deleted.', 'success');
    } catch (error) {
      set({ deletingId: null });
      notify(errorMessage(error, 'Failed to delete badge.'), 'error');
    }
  },

  openGrant: () => {
    set({ isGrantOpen: true });
    void get().loadUsers();
  },
  closeGrant: () => set({ isGrantOpen: false }),

  grant: async (userId, badgeId) => {
    set({ granting: true });
    try {
      await grantBadgeRequest({ userId, badgeId });
      set({ granting: false, isGrantOpen: false });
      notify('Badge granted.', 'success');
      await get().loadBadges();
    } catch (error) {
      set({ granting: false });
      notify(errorMessage(error, 'Failed to grant badge.'), 'error');
    }
  },

  revoke: async (userId, badgeId) => {
    set({ granting: true });
    try {
      await revokeBadgeRequest({ userId, badgeId });
      set({ granting: false, isGrantOpen: false });
      notify('Badge revoked.', 'success');
      await get().loadBadges();
    } catch (error) {
      set({ granting: false });
      notify(errorMessage(error, 'Failed to revoke badge.'), 'error');
    }
  },
}));
