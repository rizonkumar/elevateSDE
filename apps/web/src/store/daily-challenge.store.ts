import { create } from 'zustand';
import type { DailyChallengeDto, StreakSummaryDto } from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';

interface DailyChallengeState {
  today: DailyChallengeDto | null;
  streak: StreakSummaryDto | null;
  isLoading: boolean;
  hasLoaded: boolean;
  fetchDaily: () => Promise<void>;
}

export const useDailyChallengeStore = create<DailyChallengeState>((set) => ({
  today: null,
  streak: null,
  isLoading: false,
  hasLoaded: false,

  fetchDaily: async () => {
    set({ isLoading: true });
    try {
      const [todayResponse, streakResponse] = await Promise.all([
        api.get<DailyChallengeDto | null>('/api/v1/daily-challenge/today'),
        api.get<StreakSummaryDto>('/api/v1/daily-challenge/streak'),
      ]);
      set({
        today: todayResponse.data,
        streak: streakResponse.data,
        isLoading: false,
        hasLoaded: true,
      });
    } catch {
      set({ isLoading: false, hasLoaded: true });
      useToastStore.getState().addToast('Could not load your daily challenge.', 'error');
    }
  },
}));
