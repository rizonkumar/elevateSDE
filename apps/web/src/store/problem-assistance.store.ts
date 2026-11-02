import axios from 'axios';
import { create } from 'zustand';
import type { ProblemAssistanceDto, ProblemEditorialDto } from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';

interface ProblemAssistanceState {
  assistance: Record<string, ProblemAssistanceDto>;
  editorials: Record<string, ProblemEditorialDto>;
  isRevealing: boolean;
  isGivingUp: boolean;
  isLoadingEditorial: boolean;
  fetchAssistance: (problemId: string) => Promise<void>;
  revealHint: (problemId: string) => Promise<void>;
  giveUp: (problemId: string) => Promise<boolean>;
  fetchEditorial: (problemId: string) => Promise<void>;
}

function messageFor(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  const message: unknown = error.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
}

export const useProblemAssistanceStore = create<ProblemAssistanceState>((set) => ({
  assistance: {},
  editorials: {},
  isRevealing: false,
  isGivingUp: false,
  isLoadingEditorial: false,

  fetchAssistance: async (problemId) => {
    try {
      const response = await api.get<ProblemAssistanceDto>(
        `/api/v1/problems/${problemId}/assistance`,
      );
      set((state) => ({ assistance: { ...state.assistance, [problemId]: response.data } }));
    } catch {
      return;
    }
  },

  revealHint: async (problemId) => {
    set({ isRevealing: true });
    try {
      const response = await api.post<ProblemAssistanceDto>(
        `/api/v1/problems/${problemId}/hints/reveal`,
      );
      set((state) => ({ assistance: { ...state.assistance, [problemId]: response.data } }));
    } catch (error) {
      useToastStore.getState().addToast(messageFor(error, 'Could not reveal the hint.'), 'error');
    } finally {
      set({ isRevealing: false });
    }
  },

  giveUp: async (problemId) => {
    set({ isGivingUp: true });
    try {
      const response = await api.post<ProblemAssistanceDto>(
        `/api/v1/problems/${problemId}/editorial/unlock`,
      );
      set((state) => ({ assistance: { ...state.assistance, [problemId]: response.data } }));
      return true;
    } catch (error) {
      useToastStore
        .getState()
        .addToast(messageFor(error, 'Could not unlock the editorial.'), 'error');
      return false;
    } finally {
      set({ isGivingUp: false });
    }
  },

  fetchEditorial: async (problemId) => {
    set({ isLoadingEditorial: true });
    try {
      const response = await api.get<ProblemEditorialDto>(
        `/api/v1/problems/${problemId}/editorial`,
      );
      set((state) => ({ editorials: { ...state.editorials, [problemId]: response.data } }));
    } catch (error) {
      useToastStore
        .getState()
        .addToast(messageFor(error, 'Could not load the editorial.'), 'error');
    } finally {
      set({ isLoadingEditorial: false });
    }
  },
}));
