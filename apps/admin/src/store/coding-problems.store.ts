import { create } from 'zustand';
import type {
  AdminCodingProblemDto,
  AssessmentDifficulty,
  AssessmentLanguage,
  AssessmentTestCase,
  ProblemSummaryDto,
} from '@elevatesde/shared-types';
import { fetchProblem, fetchProblemList } from '../lib/coding-problems-api';
import { useToastStore } from './toast.store';

interface AxiosErrorResponse {
  response?: { data?: { message?: string } };
}

const errorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosErrorResponse;
  return axiosError.response?.data?.message ?? fallback;
};

const EMPTY_STARTER_CODE: Record<AssessmentLanguage, string> = {
  javascript: '',
  python: '',
  cpp: '',
};

const toAdminProblem = (summary: ProblemSummaryDto): AdminCodingProblemDto => ({
  ...summary,
  description: '',
  constraints: [],
  starterCode: { ...EMPTY_STARTER_CODE },
  examples: [],
  testCases: [],
  isPublished: true,
  createdAt: '',
  updatedAt: '',
});

export type DifficultyFilter = AssessmentDifficulty | 'ALL';

export interface ProblemFormValues {
  title: string;
  difficulty: AssessmentDifficulty;
  timeLimitMinutes: number;
  tags: string[];
  description: string;
  starterCode: Record<AssessmentLanguage, string>;
  testCases: AssessmentTestCase[];
  isPublished: boolean;
}

interface CodingProblemsState {
  problems: AdminCodingProblemDto[];
  loading: boolean;
  search: string;
  difficultyFilter: DifficultyFilter;
  isModalOpen: boolean;
  editingId: string | null;
  pendingDeleteId: string | null;
  savingId: string | null;
  togglingId: string | null;
  deletingId: string | null;
  loadProblems: () => Promise<void>;
  setSearch: (search: string) => void;
  setDifficultyFilter: (difficulty: DifficultyFilter) => void;
  openCreate: () => void;
  openEdit: (id: string) => Promise<void>;
  closeModal: () => void;
  createProblem: (values: ProblemFormValues) => Promise<void>;
  updateProblem: (id: string, values: ProblemFormValues) => Promise<void>;
  togglePublish: (id: string) => Promise<void>;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

const notify = (message: string, type: 'success' | 'error') =>
  useToastStore.getState().addToast(message, type);

export const useCodingProblemsStore = create<CodingProblemsState>((set, get) => ({
  problems: [],
  loading: true,
  search: '',
  difficultyFilter: 'ALL',
  isModalOpen: false,
  editingId: null,
  pendingDeleteId: null,
  savingId: null,
  togglingId: null,
  deletingId: null,

  loadProblems: async () => {
    set({ loading: true });
    try {
      const result = await fetchProblemList();
      set({ problems: result.items.map(toAdminProblem), loading: false });
    } catch (error) {
      set({ loading: false });
      notify(errorMessage(error, 'Failed to retrieve coding problems.'), 'error');
    }
  },

  setSearch: (search) => set({ search }),
  setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter }),

  openCreate: () => set({ isModalOpen: true, editingId: null }),
  openEdit: async (id) => {
    try {
      const detail = await fetchProblem(id);
      set((state) => ({
        problems: state.problems.map((problem) =>
          problem.id === id ? { ...problem, ...detail } : problem,
        ),
        isModalOpen: true,
        editingId: id,
      }));
    } catch (error) {
      notify(errorMessage(error, 'Failed to load problem details.'), 'error');
    }
  },
  closeModal: () => set({ isModalOpen: false, editingId: null }),

  createProblem: async (values) => {
    set({ savingId: 'new' });
    try {
      const now = new Date().toISOString();
      const problem: AdminCodingProblemDto = {
        id: crypto.randomUUID(),
        ...values,
        constraints: [],
        examples: [],
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        problems: [problem, ...state.problems],
        savingId: null,
        isModalOpen: false,
        editingId: null,
      }));
      notify('Coding problem created.', 'success');
    } catch {
      set({ savingId: null });
      notify('Failed to create coding problem.', 'error');
    }
  },

  updateProblem: async (id, values) => {
    set({ savingId: id });
    try {
      const now = new Date().toISOString();
      set((state) => ({
        problems: state.problems.map((problem) =>
          problem.id === id ? { ...problem, ...values, updatedAt: now } : problem,
        ),
        savingId: null,
        isModalOpen: false,
        editingId: null,
      }));
      notify('Coding problem updated.', 'success');
    } catch {
      set({ savingId: null });
      notify('Failed to update coding problem.', 'error');
    }
  },

  togglePublish: async (id) => {
    set({ togglingId: id });
    try {
      const target = get().problems.find((problem) => problem.id === id);
      const nextPublished = !target?.isPublished;
      const now = new Date().toISOString();
      set((state) => ({
        problems: state.problems.map((problem) =>
          problem.id === id ? { ...problem, isPublished: nextPublished, updatedAt: now } : problem,
        ),
        togglingId: null,
      }));
      notify(nextPublished ? 'Problem published.' : 'Problem unpublished.', 'success');
    } catch {
      set({ togglingId: null });
      notify('Failed to update publish state.', 'error');
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
      set((state) => ({
        problems: state.problems.filter((problem) => problem.id !== id),
        deletingId: null,
        pendingDeleteId: null,
      }));
      notify('Coding problem deleted.', 'success');
    } catch {
      set({ deletingId: null });
      notify('Failed to delete coding problem.', 'error');
    }
  },
}));
