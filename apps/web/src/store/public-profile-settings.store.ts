import { create } from 'zustand';
import type { PublicProfileSettingsDto, UpdatePublicProfileRequest } from '@elevatesde/shared-types';
import {
  apiErrorMessage,
  getPublicProfileSettings,
  updatePublicProfileSettings,
} from '@/lib/public-profile-api';
import { useToastStore } from '@/store/toast.store';

interface PublicProfileSettingsState {
  settings: PublicProfileSettingsDto | null;
  hasLoaded: boolean;
  isSaving: boolean;
  load: () => Promise<void>;
  save: (request: UpdatePublicProfileRequest) => Promise<boolean>;
}

export const usePublicProfileSettingsStore = create<PublicProfileSettingsState>((set) => ({
  settings: null,
  hasLoaded: false,
  isSaving: false,

  load: async () => {
    try {
      const settings = await getPublicProfileSettings();
      set({ settings, hasLoaded: true });
    } catch {
      set({ hasLoaded: true });
      useToastStore.getState().addToast('Could not load your public profile settings.', 'error');
    }
  },

  save: async (request) => {
    set({ isSaving: true });
    try {
      const settings = await updatePublicProfileSettings(request);
      set({ settings, isSaving: false });
      useToastStore.getState().addToast('Public profile saved.', 'success');
      return true;
    } catch (error) {
      set({ isSaving: false });
      useToastStore
        .getState()
        .addToast(apiErrorMessage(error, 'Could not save your public profile.'), 'error');
      return false;
    }
  },
}));
