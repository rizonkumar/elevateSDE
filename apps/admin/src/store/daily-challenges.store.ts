import { create } from 'zustand';
import type { DailyChallengeScheduleDto } from '@elevatesde/shared-types';
import { fetchProblemList } from '../lib/coding-problems-api';
import {
  createDailyChallenge as createDailyChallengeRequest,
  deleteDailyChallenge as deleteDailyChallengeRequest,
  fetchSchedule,
} from '../lib/daily-challenges-api';
import { useToastStore } from './toast.store';

const PROBLEM_OPTIONS_PAGE_SIZE = 100;

export interface ProblemOption {
  value: string;
  label: string;
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

interface DailyChallengesState {
  schedule: DailyChallengeScheduleDto[];
  problemOptions: ProblemOption[];
  loading: boolean;
  isModalOpen: boolean;
  saving: boolean;
  pendingDeleteId: string | null;
  deletingId: string | null;
  loadSchedule: () => Promise<void>;
  loadProblemOptions: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  createChallenge: (challengeDate: string, problemId: string) => Promise<boolean>;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

export const useDailyChallengesStore = create<DailyChallengesState>((set, get) => ({
  schedule: [],
  problemOptions: [],
  loading: true,
  isModalOpen: false,
  saving: false,
  pendingDeleteId: null,
  deletingId: null,

  loadSchedule: async () => {
    set({ loading: true });
    try {
      const schedule = await fetchSchedule({});
      set({ schedule, loading: false });
    } catch (error) {
      set({ loading: false });
      notify(errorMessage(error, 'Failed to load the daily challenge schedule.'), 'error');
    }
  },

  loadProblemOptions: async () => {
    try {
      const result = await fetchProblemList({ page: 1, pageSize: PROBLEM_OPTIONS_PAGE_SIZE });
      const problemOptions = result.items
        .filter((problem) => problem.isPublished)
        .map((problem) => ({ value: problem.id, label: problem.title }));
      set({ problemOptions });
    } catch (error) {
      notify(errorMessage(error, 'Failed to load published problems.'), 'error');
    }
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  createChallenge: async (challengeDate, problemId) => {
    set({ saving: true });
    try {
      await createDailyChallengeRequest({ challengeDate, problemId });
      set({ saving: false, isModalOpen: false });
      notify('Daily challenge scheduled.', 'success');
      await get().loadSchedule();
      return true;
    } catch (error) {
      set({ saving: false });
      notify(errorMessage(error, 'Failed to schedule the daily challenge.'), 'error');
      return false;
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
      await deleteDailyChallengeRequest(id);
      set((state) => ({
        schedule: state.schedule.filter((entry) => entry.id !== id),
        deletingId: null,
        pendingDeleteId: null,
      }));
      notify('Daily challenge removed.', 'success');
    } catch (error) {
      set({ deletingId: null });
      notify(errorMessage(error, 'Failed to remove the daily challenge.'), 'error');
    }
  },
}));
