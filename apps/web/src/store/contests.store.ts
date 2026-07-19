import { create } from 'zustand';
import type {
  ContestDetailDto,
  ContestStandingRowDto,
  ContestSummaryDto,
} from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';

interface ContestsState {
  contests: ContestSummaryDto[];
  active: ContestDetailDto | null;
  standings: ContestStandingRowDto[];
  isLoading: boolean;
  isDetailLoading: boolean;
  isStandingsLoading: boolean;
  isRegistering: boolean;
  loadContests: () => Promise<void>;
  loadContest: (slug: string) => Promise<void>;
  register: (slug: string) => Promise<void>;
  loadStandings: (slug: string, silent?: boolean) => Promise<void>;
}

const ENDPOINT = '/api/v1/contests';

export const useContestsStore = create<ContestsState>((set, get) => ({
  contests: [],
  active: null,
  standings: [],
  isLoading: false,
  isDetailLoading: false,
  isStandingsLoading: false,
  isRegistering: false,

  loadContests: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<ContestSummaryDto[]>(ENDPOINT);
      set({ contests: response.data, isLoading: false });
    } catch {
      set({ isLoading: false });
      useToastStore.getState().addToast('Could not load contests.', 'error');
    }
  },

  loadContest: async (slug) => {
    set({ isDetailLoading: true, active: null });
    try {
      const response = await api.get<ContestDetailDto>(`${ENDPOINT}/${slug}`);
      set({ active: response.data, isDetailLoading: false });
    } catch {
      set({ isDetailLoading: false });
      useToastStore.getState().addToast('Could not load this contest.', 'error');
    }
  },

  register: async (slug) => {
    set({ isRegistering: true });
    try {
      await api.post(`${ENDPOINT}/${slug}/register`);
      set({ isRegistering: false });
      useToastStore.getState().addToast('You are registered for the contest.', 'success');
      await get().loadContest(slug);
    } catch {
      set({ isRegistering: false });
      useToastStore.getState().addToast('Could not register for the contest.', 'error');
    }
  },

  loadStandings: async (slug, silent = false) => {
    if (!silent) {
      set({ isStandingsLoading: true });
    }
    try {
      const response = await api.get<ContestStandingRowDto[]>(`${ENDPOINT}/${slug}/standings`);
      set({ standings: response.data, isStandingsLoading: false });
    } catch {
      set({ isStandingsLoading: false });
      if (!silent) {
        useToastStore.getState().addToast('Could not load the standings.', 'error');
      }
    }
  },
}));
