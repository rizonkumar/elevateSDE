import { create } from 'zustand';
import type {
  ContestRatingLeaderboardDto,
  ContestRatingLeaderboardEntryDto,
  ContestRatingScope,
  ContestRatingSummaryDto,
} from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';

const ENDPOINT = '/api/v1/contests/ratings';

interface ContestRatingState {
  summary: ContestRatingSummaryDto | null;
  hasLoadedSummary: boolean;
  scope: ContestRatingScope;
  entries: ContestRatingLeaderboardEntryDto[];
  total: number;
  page: number;
  pageSize: number;
  isLeaderboardLoading: boolean;
  loadSummary: () => Promise<void>;
  setScope: (scope: ContestRatingScope) => void;
  loadLeaderboard: (page?: number) => Promise<void>;
}

export const useContestRatingStore = create<ContestRatingState>((set, get) => ({
  summary: null,
  hasLoadedSummary: false,
  scope: 'platform',
  entries: [],
  total: 0,
  page: 1,
  pageSize: 25,
  isLeaderboardLoading: false,

  loadSummary: async () => {
    try {
      const { data } = await api.get<ContestRatingSummaryDto>(`${ENDPOINT}/me`);
      set({ summary: data, hasLoadedSummary: true });
    } catch {
      set({ hasLoadedSummary: true });
    }
  },

  setScope: (scope) => set({ scope, entries: [], total: 0, page: 1 }),

  loadLeaderboard: async (page = 1) => {
    set({ isLeaderboardLoading: true });
    try {
      const { data } = await api.get<ContestRatingLeaderboardDto>(`${ENDPOINT}/leaderboard`, {
        params: { scope: get().scope, page },
      });
      set((state) => ({
        entries: page === 1 ? data.items : [...state.entries, ...data.items],
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        isLeaderboardLoading: false,
      }));
    } catch {
      set({ isLeaderboardLoading: false });
      useToastStore.getState().addToast('Could not load the rating leaderboard.', 'error');
    }
  },
}));
