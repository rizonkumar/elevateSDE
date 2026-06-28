import { create } from 'zustand';
import type { AchievementsViewDto } from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';

interface AchievementsState {
  view: AchievementsViewDto | null;
  isLoading: boolean;
  hasLoaded: boolean;
  fetchAchievements: () => Promise<void>;
}

export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  view: null,
  isLoading: false,
  hasLoaded: false,

  fetchAchievements: async () => {
    const previous = get().view;
    set({ isLoading: true });
    try {
      const response = await api.get<AchievementsViewDto>('/api/v1/achievements');
      const next = response.data;
      if (previous) {
        const knownKeys = new Set(previous.earned.map((badge) => badge.key));
        for (const badge of next.earned) {
          if (!knownKeys.has(badge.key)) {
            useToastStore.getState().addToast(`Badge unlocked: ${badge.name}`, 'success');
          }
        }
      }
      set({ view: next, isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, hasLoaded: true });
      useToastStore.getState().addToast('Could not load your achievements.', 'error');
    }
  },
}));
