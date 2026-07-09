import { create } from 'zustand';
import type {
  AdminLearningPathDetailDto,
  AdminLearningPathSummaryDto,
  PathLevel,
  ReorderDirection,
} from '@elevatesde/shared-types';
import { fetchProblemList } from '../lib/coding-problems-api';
import {
  addLearningPathItem,
  addLearningPathModule,
  createLearningPath,
  deleteLearningPath,
  deleteLearningPathItem,
  deleteLearningPathModule,
  fetchLearningPath,
  fetchLearningPaths,
  renameLearningPathModule,
  reorderLearningPathItem,
  reorderLearningPathModule,
  setLearningPathPublished,
  updateLearningPath,
} from '../lib/learning-paths-api';
import { useToastStore } from './toast.store';

const PROBLEM_OPTIONS_PAGE_SIZE = 100;

export interface ProblemOption {
  value: string;
  label: string;
}

export interface LearningPathFormValues {
  title: string;
  slug: string;
  description: string;
  level: PathLevel;
  tags: string[];
  coverImage: string | null;
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

interface LearningPathsState {
  paths: AdminLearningPathSummaryDto[];
  editingPath: AdminLearningPathDetailDto | null;
  loading: boolean;
  isModalOpen: boolean;
  saving: boolean;
  publishingId: string | null;
  pendingDeleteId: string | null;
  deletingId: string | null;
  active: AdminLearningPathDetailDto | null;
  activeLoading: boolean;
  problemOptions: ProblemOption[];
  busy: boolean;
  loadPaths: () => Promise<void>;
  openCreate: () => void;
  openEdit: (id: string) => Promise<void>;
  closeModal: () => void;
  savePath: (values: LearningPathFormValues) => Promise<string | null>;
  togglePublish: (id: string, publish: boolean) => Promise<void>;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
  loadPath: (id: string) => Promise<void>;
  loadProblemOptions: () => Promise<void>;
  addModule: (title: string) => Promise<void>;
  renameModule: (moduleId: string, title: string) => Promise<void>;
  removeModule: (moduleId: string) => Promise<void>;
  reorderModule: (moduleId: string, direction: ReorderDirection) => Promise<void>;
  addItem: (moduleId: string, problemId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  reorderItem: (itemId: string, direction: ReorderDirection) => Promise<void>;
  toggleActivePublish: (publish: boolean) => Promise<void>;
}

export const useLearningPathsStore = create<LearningPathsState>((set, get) => {
  const runMutation = async (
    request: () => Promise<AdminLearningPathDetailDto>,
    fallback: string,
    successMessage?: string,
  ): Promise<void> => {
    set({ busy: true });
    try {
      const path = await request();
      set({ active: path, busy: false });
      if (successMessage) {
        notify(successMessage, 'success');
      }
    } catch (error) {
      set({ busy: false });
      notify(errorMessage(error, fallback), 'error');
    }
  };

  const requireActiveId = (): string => {
    const id = get().active?.id;
    if (!id) {
      throw new Error('No active learning path');
    }
    return id;
  };

  return {
    paths: [],
    editingPath: null,
    loading: true,
    isModalOpen: false,
    saving: false,
    publishingId: null,
    pendingDeleteId: null,
    deletingId: null,
    active: null,
    activeLoading: true,
    problemOptions: [],
    busy: false,

    loadPaths: async () => {
      set({ loading: true });
      try {
        const result = await fetchLearningPaths();
        set({ paths: result.items, loading: false });
      } catch (error) {
        set({ loading: false });
        notify(errorMessage(error, 'Failed to load learning paths.'), 'error');
      }
    },

    openCreate: () => set({ editingPath: null, isModalOpen: true }),

    openEdit: async (id) => {
      try {
        const path = await fetchLearningPath(id);
        set({ editingPath: path, isModalOpen: true });
      } catch (error) {
        notify(errorMessage(error, 'Failed to open the learning path.'), 'error');
      }
    },

    closeModal: () => set({ isModalOpen: false, editingPath: null }),

    savePath: async (values) => {
      set({ saving: true });
      try {
        const payload = {
          title: values.title,
          slug: values.slug,
          description: values.description,
          level: values.level,
          tags: values.tags,
          coverImage: values.coverImage,
        };
        const existing = get().editingPath;
        const path = existing
          ? await updateLearningPath(existing.id, payload)
          : await createLearningPath(payload);
        set({ saving: false, isModalOpen: false, editingPath: null });
        notify(existing ? 'Learning path updated.' : 'Learning path created.', 'success');
        await get().loadPaths();
        return existing ? null : path.id;
      } catch (error) {
        set({ saving: false });
        notify(errorMessage(error, 'Failed to save the learning path.'), 'error');
        return null;
      }
    },

    togglePublish: async (id, publish) => {
      set({ publishingId: id });
      try {
        await setLearningPathPublished(id, publish);
        set({ publishingId: null });
        notify(publish ? 'Learning path published.' : 'Learning path unpublished.', 'success');
        await get().loadPaths();
      } catch (error) {
        set({ publishingId: null });
        notify(errorMessage(error, 'Failed to update the learning path status.'), 'error');
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
        await deleteLearningPath(id);
        set((state) => ({
          paths: state.paths.filter((entry) => entry.id !== id),
          deletingId: null,
          pendingDeleteId: null,
        }));
        notify('Learning path deleted.', 'success');
      } catch (error) {
        set({ deletingId: null });
        notify(errorMessage(error, 'Failed to delete the learning path.'), 'error');
      }
    },

    loadPath: async (id) => {
      set({ activeLoading: true });
      try {
        const path = await fetchLearningPath(id);
        set({ active: path, activeLoading: false });
      } catch (error) {
        set({ activeLoading: false });
        notify(errorMessage(error, 'Failed to load the learning path.'), 'error');
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

    addModule: async (title) => {
      await runMutation(
        () => addLearningPathModule(requireActiveId(), title),
        'Failed to add the module.',
      );
    },

    renameModule: async (moduleId, title) => {
      await runMutation(
        () => renameLearningPathModule(moduleId, title),
        'Failed to rename the module.',
      );
    },

    removeModule: async (moduleId) => {
      await runMutation(() => deleteLearningPathModule(moduleId), 'Failed to remove the module.');
    },

    reorderModule: async (moduleId, direction) => {
      await runMutation(
        () => reorderLearningPathModule(moduleId, direction),
        'Failed to reorder the module.',
      );
    },

    addItem: async (moduleId, problemId) => {
      await runMutation(
        () => addLearningPathItem(moduleId, problemId),
        'Failed to add the problem.',
      );
    },

    removeItem: async (itemId) => {
      await runMutation(() => deleteLearningPathItem(itemId), 'Failed to remove the problem.');
    },

    reorderItem: async (itemId, direction) => {
      await runMutation(
        () => reorderLearningPathItem(itemId, direction),
        'Failed to reorder the problem.',
      );
    },

    toggleActivePublish: async (publish) => {
      const id = get().active?.id;
      if (!id) {
        return;
      }
      await runMutation(
        () => setLearningPathPublished(id, publish),
        'Failed to update the learning path status.',
        publish ? 'Learning path published.' : 'Learning path unpublished.',
      );
    },
  };
});
