import { create } from 'zustand';
import type {
  DashboardStatsDto,
  StreakSummaryDto,
  SubmissionHeatmapDto,
  UserDto,
} from '@elevatesde/shared-types';
import { getDashboardStats } from '@/lib/dashboard-api';
import { getMe, getStreakSummary, getSubmissionHeatmap } from '@/lib/profile-api';
import { useToastStore } from '@/store/toast.store';

interface ProfileState {
  user: UserDto | null;
  stats: DashboardStatsDto | null;
  streak: StreakSummaryDto | null;
  heatmap: SubmissionHeatmapDto | null;
  isLoading: boolean;
  hasLoaded: boolean;
  loadProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  user: null,
  stats: null,
  streak: null,
  heatmap: null,
  isLoading: false,
  hasLoaded: false,

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const [user, stats, streak, heatmap] = await Promise.all([
        getMe(),
        getDashboardStats(),
        getStreakSummary(),
        getSubmissionHeatmap(),
      ]);
      set({ user, stats, streak, heatmap, isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, hasLoaded: true });
      useToastStore.getState().addToast('Could not load your profile.', 'error');
    }
  },
}));
