import { create } from 'zustand';
import type { AdminContestDetailDto, AdminContestSummaryDto } from '@elevatesde/shared-types';
import { fetchProblemList } from '../lib/coding-problems-api';
import {
  createContest as createContestRequest,
  deleteContest as deleteContestRequest,
  fetchContest,
  fetchContests,
  setContestProblems,
  setContestPublished,
  updateContest as updateContestRequest,
} from '../lib/contests-api';
import { useToastStore } from './toast.store';

const PROBLEM_OPTIONS_PAGE_SIZE = 100;

export interface ProblemOption {
  value: string;
  label: string;
}

export interface ContestFormProblem {
  problemId: string;
  points: number;
}

export interface ContestFormValues {
  title: string;
  slug: string;
  description: string;
  startsAt: string;
  endsAt: string;
  problems: ContestFormProblem[];
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

interface ContestsState {
  contests: AdminContestSummaryDto[];
  editingContest: AdminContestDetailDto | null;
  problemOptions: ProblemOption[];
  loading: boolean;
  isModalOpen: boolean;
  saving: boolean;
  publishingId: string | null;
  pendingDeleteId: string | null;
  deletingId: string | null;
  loadContests: () => Promise<void>;
  loadProblemOptions: () => Promise<void>;
  openCreate: () => void;
  openEdit: (id: string) => Promise<void>;
  closeModal: () => void;
  saveContest: (values: ContestFormValues) => Promise<boolean>;
  togglePublish: (id: string, publish: boolean) => Promise<void>;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

export const useContestsStore = create<ContestsState>((set, get) => ({
  contests: [],
  editingContest: null,
  problemOptions: [],
  loading: true,
  isModalOpen: false,
  saving: false,
  publishingId: null,
  pendingDeleteId: null,
  deletingId: null,

  loadContests: async () => {
    set({ loading: true });
    try {
      const result = await fetchContests();
      set({ contests: result.items, loading: false });
    } catch (error) {
      set({ loading: false });
      notify(errorMessage(error, 'Failed to load contests.'), 'error');
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

  openCreate: () => set({ editingContest: null, isModalOpen: true }),

  openEdit: async (id) => {
    try {
      const contest = await fetchContest(id);
      set({ editingContest: contest, isModalOpen: true });
    } catch (error) {
      notify(errorMessage(error, 'Failed to open the contest.'), 'error');
    }
  },

  closeModal: () => set({ isModalOpen: false, editingContest: null }),

  saveContest: async (values) => {
    set({ saving: true });
    try {
      const payload = {
        title: values.title,
        slug: values.slug,
        description: values.description,
        startsAt: values.startsAt,
        endsAt: values.endsAt,
      };
      const existing = get().editingContest;
      const contest = existing
        ? await updateContestRequest(existing.id, payload)
        : await createContestRequest(payload);
      if (values.problems.length > 0) {
        await setContestProblems(contest.id, { problems: values.problems });
      }
      set({ saving: false, isModalOpen: false, editingContest: null });
      notify(existing ? 'Contest updated.' : 'Contest created.', 'success');
      await get().loadContests();
      return true;
    } catch (error) {
      set({ saving: false });
      notify(errorMessage(error, 'Failed to save the contest.'), 'error');
      return false;
    }
  },

  togglePublish: async (id, publish) => {
    set({ publishingId: id });
    try {
      await setContestPublished(id, publish);
      set({ publishingId: null });
      notify(publish ? 'Contest published.' : 'Contest unpublished.', 'success');
      await get().loadContests();
    } catch (error) {
      set({ publishingId: null });
      notify(errorMessage(error, 'Failed to update the contest status.'), 'error');
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
      await deleteContestRequest(id);
      set((state) => ({
        contests: state.contests.filter((entry) => entry.id !== id),
        deletingId: null,
        pendingDeleteId: null,
      }));
      notify('Contest deleted.', 'success');
    } catch (error) {
      set({ deletingId: null });
      notify(errorMessage(error, 'Failed to delete the contest.'), 'error');
    }
  },
}));
