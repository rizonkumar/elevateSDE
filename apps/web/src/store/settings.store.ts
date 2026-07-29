import { create } from 'zustand';
import type {
  NotificationPreferenceDto,
  NotificationType,
  UpdateProfileDto,
  UserDto,
} from '@elevatesde/shared-types';
import {
  checkHandleAvailability,
  getMe,
  getNotificationPreferences,
  updateNotificationPreference,
  updateProfile,
} from '@/lib/profile-api';
import { useToastStore } from '@/store/toast.store';

export type HandleStatus = 'idle' | 'checking' | 'available' | 'taken';

interface SettingsState {
  profile: UserDto | null;
  preferences: NotificationPreferenceDto[];
  isLoading: boolean;
  hasLoaded: boolean;
  isSaving: boolean;
  handleStatus: HandleStatus;
  loadSettings: () => Promise<void>;
  saveProfile: (patch: UpdateProfileDto) => Promise<boolean>;
  checkHandle: (handle: string) => Promise<void>;
  resetHandleStatus: () => void;
  togglePreference: (type: NotificationType, enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  profile: null,
  preferences: [],
  isLoading: false,
  hasLoaded: false,
  isSaving: false,
  handleStatus: 'idle',

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const [profile, preferences] = await Promise.all([
        getMe(),
        getNotificationPreferences(),
      ]);
      set({ profile, preferences, isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, hasLoaded: true });
      useToastStore.getState().addToast('Could not load your settings.', 'error');
    }
  },

  saveProfile: async (patch) => {
    set({ isSaving: true });
    try {
      const profile = await updateProfile(patch);
      set({ profile, isSaving: false });
      useToastStore.getState().addToast('Profile updated.', 'success');
      return true;
    } catch (error) {
      set({ isSaving: false });
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not update your profile.';
      useToastStore.getState().addToast(message, 'error');
      return false;
    }
  },

  checkHandle: async (handle) => {
    const current = get().profile?.handle;
    if (handle === current) {
      set({ handleStatus: 'idle' });
      return;
    }
    set({ handleStatus: 'checking' });
    try {
      const result = await checkHandleAvailability(handle);
      set({ handleStatus: result.available ? 'available' : 'taken' });
    } catch {
      set({ handleStatus: 'idle' });
    }
  },

  resetHandleStatus: () => set({ handleStatus: 'idle' }),

  togglePreference: async (type, enabled) => {
    const previous = get().preferences;
    set({
      preferences: previous.map((preference) =>
        preference.type === type ? { ...preference, inAppEnabled: enabled } : preference,
      ),
    });
    try {
      const updated = await updateNotificationPreference({ type, inAppEnabled: enabled });
      set({ preferences: updated });
    } catch {
      set({ preferences: previous });
      useToastStore.getState().addToast('Could not update notification preference.', 'error');
    }
  },
}));
