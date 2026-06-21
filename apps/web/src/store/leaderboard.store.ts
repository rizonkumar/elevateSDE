import { create } from 'zustand';
import type { LeaderboardEntryDto, LeaderboardTimeframe } from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';

const PAGE_SIZE = 12;

interface LeaderboardState {
  timeframe: LeaderboardTimeframe;
  entries: LeaderboardEntryDto[];
  visibleCount: number;
  isLoading: boolean;
  setTimeframe: (timeframe: LeaderboardTimeframe) => void;
  loadMore: () => void;
  fetchEntries: () => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  timeframe: 'all-time',
  entries: [],
  visibleCount: PAGE_SIZE,
  isLoading: false,

  setTimeframe: (timeframe) => set({ timeframe, visibleCount: PAGE_SIZE }),
  loadMore: () => set((state) => ({ visibleCount: state.visibleCount + PAGE_SIZE })),

  fetchEntries: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<LeaderboardEntryDto[]>('/api/v1/leaderboard', {
        params: { timeframe: get().timeframe },
      });
      set({ entries: data, isLoading: false });
    } catch {
      set({ isLoading: false });
      useToastStore.getState().addToast('Could not load the leaderboard.', 'error');
    }
  },
}));
