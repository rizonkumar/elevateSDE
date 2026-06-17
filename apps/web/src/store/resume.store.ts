import { create } from 'zustand';
import type { ResumeDto } from '@elevatesde/shared-types';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { extractResumeText, validateResumeFile } from '@/lib/resume-parser';
import { analyzeResumeText } from '@/lib/resume-analyzer';

interface ResumeState {
  analyses: ResumeDto[];
  activeId: string | null;
  isAnalyzing: boolean;
  analyze: (file: File) => Promise<void>;
  select: (id: string) => void;
  remove: (id: string) => void;
  reset: () => void;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `resume-${Date.now()}`;
}

async function produceAnalysis(file: File, userId: string): Promise<ResumeDto> {
  const text = await extractResumeText(file);
  if (text.trim().length < 40) {
    throw new Error('We could not read enough text from this file.');
  }
  const result = analyzeResumeText(text, file.name);
  const now = new Date().toISOString();
  return {
    id: newId(),
    userId,
    fileName: file.name,
    fileUrl: null,
    status: 'COMPLETED',
    atsScore: result.atsScore,
    parsedSkills: result.parsedSkills,
    missingSkills: result.missingSkills,
    structureFeedback: result.structureFeedback,
    actionableTips: result.actionableTips,
    summary: result.summary,
    createdAt: now,
    updatedAt: now,
  };
}

function pendingRecord(file: File, userId: string): ResumeDto {
  const now = new Date().toISOString();
  return {
    id: newId(),
    userId,
    fileName: file.name,
    fileUrl: null,
    status: 'PROCESSING',
    atsScore: null,
    parsedSkills: [],
    missingSkills: [],
    structureFeedback: [],
    actionableTips: [],
    summary: null,
    createdAt: now,
    updatedAt: now,
  };
}

export const useResumeStore = create<ResumeState>((set) => ({
  analyses: [],
  activeId: null,
  isAnalyzing: false,

  analyze: async (file) => {
    const validationError = validateResumeFile(file);
    if (validationError) {
      useToastStore.getState().addToast(validationError, 'error');
      return;
    }

    const userId = useAuthStore.getState().user?.id ?? '';
    const pending = pendingRecord(file, userId);
    set((state) => ({
      analyses: [pending, ...state.analyses],
      activeId: pending.id,
      isAnalyzing: true,
    }));

    try {
      const completed = await produceAnalysis(file, userId);
      const result: ResumeDto = { ...completed, id: pending.id, createdAt: pending.createdAt };
      set((state) => ({
        analyses: state.analyses.map((item) => (item.id === pending.id ? result : item)),
        isAnalyzing: false,
      }));
      useToastStore.getState().addToast('Resume analyzed.', 'success');
    } catch {
      set((state) => ({
        analyses: state.analyses.map((item) =>
          item.id === pending.id
            ? { ...item, status: 'FAILED', updatedAt: new Date().toISOString() }
            : item,
        ),
        isAnalyzing: false,
      }));
      useToastStore.getState().addToast('Could not analyze this resume. Try another file.', 'error');
    }
  },

  select: (id) => set({ activeId: id }),

  remove: (id) =>
    set((state) => {
      const analyses = state.analyses.filter((item) => item.id !== id);
      const activeId = state.activeId === id ? (analyses[0]?.id ?? null) : state.activeId;
      return { analyses, activeId };
    }),

  reset: () => set({ analyses: [], activeId: null, isAnalyzing: false }),
}));
