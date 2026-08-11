import { create } from 'zustand';
import type { ResumeDto } from '@elevatesde/shared-types';
import { useToastStore } from '@/store/toast.store';
import { validateResumeFile } from '@/lib/resume-parser';
import { deleteResume, getResume, getResumes, uploadResume } from '@/lib/resume-api';

const POLL_INTERVAL_MS = 2500;

interface ResumeState {
  analyses: ResumeDto[];
  activeId: string | null;
  isAnalyzing: boolean;
  fetchHistory: () => Promise<void>;
  analyze: (file: File) => Promise<void>;
  select: (id: string) => void;
  remove: (id: string) => Promise<void>;
  reset: () => void;
  stopPolling: () => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

function ensurePolling(get: () => ResumeState, set: (partial: Partial<ResumeState>) => void): void {
  if (pollTimer !== null) {
    return;
  }
  pollTimer = setInterval(() => {
    void pollProcessing(get, set);
  }, POLL_INTERVAL_MS);
}

async function pollProcessing(
  get: () => ResumeState,
  set: (partial: Partial<ResumeState>) => void,
): Promise<void> {
  const processing = get().analyses.filter((item) => item.status === 'PROCESSING');
  if (processing.length === 0) {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    return;
  }

  const results = await Promise.all(
    processing.map(async (item) => {
      try {
        return await getResume(item.id);
      } catch {
        return null;
      }
    }),
  );

  const updated = new Map(results.filter((item): item is ResumeDto => item !== null).map((item) => [item.id, item]));
  if (updated.size === 0) {
    return;
  }
  set({
    analyses: get().analyses.map((item) => updated.get(item.id) ?? item),
  });
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  analyses: [],
  activeId: null,
  isAnalyzing: false,

  fetchHistory: async () => {
    try {
      const analyses = await getResumes();
      set((state) => ({
        analyses,
        activeId: state.activeId ?? (analyses[0]?.id ?? null),
      }));
      if (analyses.some((item) => item.status === 'PROCESSING')) {
        ensurePolling(get, set);
      }
    } catch {
      useToastStore.getState().addToast('Could not load your resume history.', 'error');
    }
  },

  analyze: async (file) => {
    const validationError = validateResumeFile(file);
    if (validationError) {
      useToastStore.getState().addToast(validationError, 'error');
      return;
    }

    set({ isAnalyzing: true });
    try {
      const resume = await uploadResume(file);
      set((state) => ({
        analyses: [resume, ...state.analyses],
        activeId: resume.id,
        isAnalyzing: false,
      }));
      ensurePolling(get, set);
    } catch (error) {
      set({ isAnalyzing: false });
      useToastStore.getState().addToast(extractMessage(error, 'Could not analyze this resume.'), 'error');
    }
  },

  select: (id) => set({ activeId: id }),

  remove: async (id) => {
    try {
      await deleteResume(id);
    } catch {
      useToastStore.getState().addToast('Could not remove this analysis.', 'error');
      return;
    }
    set((state) => {
      const analyses = state.analyses.filter((item) => item.id !== id);
      const activeId = state.activeId === id ? (analyses[0]?.id ?? null) : state.activeId;
      return { analyses, activeId };
    });
  },

  reset: () => set({ analyses: [], activeId: null, isAnalyzing: false }),

  stopPolling: () => {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
}));

function extractMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) {
      return message[0] ?? fallback;
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}
