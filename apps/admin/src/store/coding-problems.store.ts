import { create } from 'zustand';
import type {
  AdminCodingProblemDto,
  AdminCodingProblemInput,
  AdminProblemSummaryDto,
  AssessmentDifficulty,
  AssessmentLanguage,
  AssessmentTestCase,
} from '@elevatesde/shared-types';
import {
  createProblem as createProblemRequest,
  deleteProblem as deleteProblemRequest,
  fetchProblem,
  fetchProblemList,
  setProblemPublished,
  updateProblem as updateProblemRequest,
} from '../lib/coding-problems-api';
import { useToastStore } from './toast.store';

export type DifficultyFilter = AssessmentDifficulty | 'ALL';

export interface ProblemFormValues {
  title: string;
  difficulty: AssessmentDifficulty;
  timeLimitMinutes: number;
  tags: string[];
  description: string;
  constraints: string[];
  starterCode: Record<AssessmentLanguage, string>;
  testCases: AssessmentTestCase[];
  isPublished: boolean;
}

const PAGE_SIZE = 20;

interface CodingProblemsState {
  problems: AdminProblemSummaryDto[];
  loading: boolean;
  search: string;
  difficultyFilter: DifficultyFilter;
  page: number;
  pageSize: number;
  total: number;
  isModalOpen: boolean;
  editingProblem: AdminCodingProblemDto | null;
  pendingDeleteId: string | null;
  savingId: string | null;
  togglingId: string | null;
  deletingId: string | null;
  loadProblems: () => Promise<void>;
  setSearch: (search: string) => void;
  setDifficultyFilter: (difficulty: DifficultyFilter) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  openCreate: () => void;
  openEdit: (id: string) => Promise<void>;
  closeModal: () => void;
  saveProblem: (values: ProblemFormValues) => Promise<void>;
  togglePublish: (id: string) => Promise<void>;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
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

const toInput = (values: ProblemFormValues): AdminCodingProblemInput => ({
  title: values.title.trim(),
  difficulty: values.difficulty,
  description: values.description,
  constraints: values.constraints,
  tags: values.tags,
  starterCode: values.starterCode,
  timeLimitMinutes: values.timeLimitMinutes,
  isPublished: values.isPublished,
  testCases: values.testCases.map((testCase) => ({
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    isHidden: testCase.isHidden,
  })),
});

const toSummary = (problem: AdminCodingProblemDto): AdminProblemSummaryDto => ({
  id: problem.id,
  title: problem.title,
  difficulty: problem.difficulty,
  tags: problem.tags,
  timeLimitMinutes: problem.timeLimitMinutes,
  isPublished: problem.isPublished,
  testCaseCount: problem.testCases.length,
  createdAt: problem.createdAt,
  updatedAt: problem.updatedAt,
});

const upsertSummary = (
  list: AdminProblemSummaryDto[],
  summary: AdminProblemSummaryDto,
): AdminProblemSummaryDto[] => {
  const exists = list.some((item) => item.id === summary.id);
  if (exists) {
    return list.map((item) => (item.id === summary.id ? summary : item));
  }
  return [summary, ...list];
};

export const useCodingProblemsStore = create<CodingProblemsState>((set, get) => ({
  problems: [],
  loading: true,
  search: '',
  difficultyFilter: 'ALL',
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  isModalOpen: false,
  editingProblem: null,
  pendingDeleteId: null,
  savingId: null,
  togglingId: null,
  deletingId: null,

  loadProblems: async () => {
    const { page, pageSize, search, difficultyFilter } = get();
    set({ loading: true });
    try {
      const result = await fetchProblemList({
        page,
        pageSize,
        search: search.trim() || undefined,
        difficulty: difficultyFilter === 'ALL' ? undefined : difficultyFilter,
      });
      set({ problems: result.items, total: result.total, loading: false });
    } catch (error) {
      set({ loading: false });
      notify(errorMessage(error, 'Failed to retrieve coding problems.'), 'error');
    }
  },

  setSearch: (search) => {
    set({ search, page: 1 });
    void get().loadProblems();
  },
  setDifficultyFilter: (difficultyFilter) => {
    set({ difficultyFilter, page: 1 });
    void get().loadProblems();
  },
  setPage: (page) => {
    set({ page });
    void get().loadProblems();
  },
  setPageSize: (pageSize) => {
    set({ pageSize, page: 1 });
    void get().loadProblems();
  },

  openCreate: () => set({ isModalOpen: true, editingProblem: null }),
  openEdit: async (id) => {
    try {
      const detail = await fetchProblem(id);
      set({ editingProblem: detail, isModalOpen: true });
    } catch (error) {
      notify(errorMessage(error, 'Failed to load problem details.'), 'error');
    }
  },
  closeModal: () => set({ isModalOpen: false, editingProblem: null }),

  saveProblem: async (values) => {
    const editing = get().editingProblem;
    set({ savingId: editing ? editing.id : 'new' });
    try {
      const input = toInput(values);
      if (editing) {
        const saved = await updateProblemRequest(editing.id, input);
        set((state) => ({
          problems: upsertSummary(state.problems, toSummary(saved)),
          savingId: null,
          isModalOpen: false,
          editingProblem: null,
        }));
        notify('Coding problem updated.', 'success');
        return;
      }
      await createProblemRequest(input);
      set({ savingId: null, isModalOpen: false, editingProblem: null, page: 1 });
      notify('Coding problem created.', 'success');
      await get().loadProblems();
    } catch (error) {
      set({ savingId: null });
      notify(errorMessage(error, 'Failed to save coding problem.'), 'error');
    }
  },

  togglePublish: async (id) => {
    set({ togglingId: id });
    const target = get().problems.find((problem) => problem.id === id);
    try {
      const saved = await setProblemPublished(id, !target?.isPublished);
      set((state) => ({
        problems: state.problems.map((problem) => (problem.id === id ? toSummary(saved) : problem)),
        togglingId: null,
      }));
      notify(saved.isPublished ? 'Problem published.' : 'Problem unpublished.', 'success');
    } catch (error) {
      set({ togglingId: null });
      notify(errorMessage(error, 'Failed to update publish state.'), 'error');
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
      await deleteProblemRequest(id);
      set((state) => ({
        problems: state.problems.filter((problem) => problem.id !== id),
        total: Math.max(0, state.total - 1),
        deletingId: null,
        pendingDeleteId: null,
      }));
      notify('Coding problem deleted.', 'success');
    } catch (error) {
      set({ deletingId: null });
      notify(errorMessage(error, 'Failed to delete coding problem.'), 'error');
    }
  },
}));
