import { create } from 'zustand';
import type { LearningPathDetailDto, LearningPathDto } from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';

interface LearningPathsState {
  paths: LearningPathDto[];
  active: LearningPathDetailDto | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  enrollingId: string | null;
  loadPaths: () => Promise<void>;
  loadPath: (slug: string) => Promise<void>;
  enroll: (id: string, slug: string) => Promise<void>;
}

const ENDPOINT = '/api/v1/learning-paths';

export const useLearningPathsStore = create<LearningPathsState>((set, get) => ({
  paths: [],
  active: null,
  isLoading: false,
  isDetailLoading: false,
  enrollingId: null,

  loadPaths: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<LearningPathDto[]>(ENDPOINT);
      set({ paths: response.data, isLoading: false });
    } catch {
      set({ isLoading: false });
      useToastStore.getState().addToast('Could not load learning paths.', 'error');
    }
  },

  loadPath: async (slug) => {
    set({ isDetailLoading: true, active: null });
    try {
      const response = await api.get<LearningPathDetailDto>(`${ENDPOINT}/${slug}`);
      set({ active: response.data, isDetailLoading: false });
    } catch {
      set({ isDetailLoading: false });
      useToastStore.getState().addToast('Could not load this learning path.', 'error');
    }
  },

  enroll: async (id, slug) => {
    set({ enrollingId: id });
    try {
      await api.post(`${ENDPOINT}/${id}/enroll`);
      set({ enrollingId: null });
      useToastStore.getState().addToast('Enrolled in the path.', 'success');
      const active = get().active;
      if (active && active.id === id) {
        await get().loadPath(slug);
      }
      await get().loadPaths();
    } catch {
      set({ enrollingId: null });
      useToastStore.getState().addToast('Could not enroll in the path.', 'error');
    }
  },
}));
