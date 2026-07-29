import { create } from 'zustand';
import type {
  AssessmentLanguage,
  SubmissionStatusValue,
  SubmissionSummaryDto,
} from '@elevatesde/shared-types';
import { listSubmissions } from '@/lib/assessments-api';
import { useToastStore } from '@/store/toast.store';

const PAGE_SIZE = 20;

interface SubmissionsFilters {
  status?: SubmissionStatusValue;
  language?: AssessmentLanguage;
}

interface SubmissionsState {
  items: SubmissionSummaryDto[];
  total: number;
  page: number;
  filters: SubmissionsFilters;
  isLoading: boolean;
  hasLoaded: boolean;
  setPage: (page: number) => void;
  setFilters: (filters: SubmissionsFilters) => void;
  fetchSubmissions: () => Promise<void>;
}

export const useSubmissionsStore = create<SubmissionsState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  filters: {},
  isLoading: false,
  hasLoaded: false,

  setPage: (page) => set({ page }),

  setFilters: (filters) => set({ filters, page: 1 }),

  fetchSubmissions: async () => {
    const { page, filters } = get();
    set({ isLoading: true });
    try {
      const data = await listSubmissions({
        page,
        pageSize: PAGE_SIZE,
        status: filters.status,
        language: filters.language,
      });
      set({ items: data.items, total: data.total, isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, hasLoaded: true });
      useToastStore.getState().addToast('Could not load your submissions.', 'error');
    }
  },
}));

export const SUBMISSIONS_PAGE_SIZE = PAGE_SIZE;
