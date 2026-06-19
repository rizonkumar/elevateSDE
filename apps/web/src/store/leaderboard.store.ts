import { create } from 'zustand';
import type { LeaderboardEntryDto, LeaderboardTimeframe } from '@elevatesde/shared-types';
import { getLeaderboardEntries } from '@/lib/leaderboard-data';

const PAGE_SIZE = 12;

interface LeaderboardState {
  timeframe: LeaderboardTimeframe;
  visibleCount: number;
  setTimeframe: (timeframe: LeaderboardTimeframe) => void;
  loadMore: () => void;
  getEntries: () => LeaderboardEntryDto[];
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  timeframe: 'all-time',
  visibleCount: PAGE_SIZE,

  setTimeframe: (timeframe) => set({ timeframe, visibleCount: PAGE_SIZE }),
  loadMore: () => set((state) => ({ visibleCount: state.visibleCount + PAGE_SIZE })),
  getEntries: () => getLeaderboardEntries(get().timeframe),
}));
