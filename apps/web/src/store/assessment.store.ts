import { create } from 'zustand';
import type { AssessmentLanguage, AssessmentRunResultDto } from '@elevatesde/shared-types';
import { useToastStore } from '@/store/toast.store';
import { runCode } from '@/lib/code-runner';
import {
  ASSESSMENT_LANGUAGE_OPTIONS,
  getProblemById,
  type AssessmentProblemSeed,
} from '@/lib/assessment-problems';

export type AssessmentStatus = 'LOADING' | 'READY' | 'NOT_FOUND';

export type ConsoleTab = 'results' | 'console';

interface AssessmentState {
  status: AssessmentStatus;
  problem: AssessmentProblemSeed | null;
  language: AssessmentLanguage;
  codeByLanguage: Record<AssessmentLanguage, string>;
  isRunning: boolean;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  lastResult: AssessmentRunResultDto | null;
  consoleTab: ConsoleTab;
  remainingSeconds: number;
  loadProblem: (id: string) => void;
  setLanguage: (language: AssessmentLanguage) => void;
  setCode: (code: string) => void;
  setConsoleTab: (tab: ConsoleTab) => void;
  run: () => Promise<void>;
  submit: () => Promise<void>;
  reset: () => void;
}

let timerId: ReturnType<typeof setInterval> | null = null;
let autosaveId: ReturnType<typeof setTimeout> | null = null;

const LANGUAGES: AssessmentLanguage[] = ASSESSMENT_LANGUAGE_OPTIONS.map((option) => option.value);

function storageKey(problemId: string, language: AssessmentLanguage): string {
  return `elevatesde:assessment:${problemId}:${language}`;
}

function readSavedCode(problemId: string, language: AssessmentLanguage): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(storageKey(problemId, language));
  } catch {
    return null;
  }
}

function writeSavedCode(problemId: string, language: AssessmentLanguage, code: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(problemId, language), code);
  } catch {
    return;
  }
}

function buildInitialCode(problem: AssessmentProblemSeed): Record<AssessmentLanguage, string> {
  const result = { ...problem.starterCode };
  for (const language of LANGUAGES) {
    const saved = readSavedCode(problem.id, language);
    if (saved !== null) {
      result[language] = saved;
    }
  }
  return result;
}

function clearTimer(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function clearAutosave(): void {
  if (autosaveId !== null) {
    clearTimeout(autosaveId);
    autosaveId = null;
  }
}

const EMPTY_CODE: Record<AssessmentLanguage, string> = {
  javascript: '',
  python: '',
  cpp: '',
};

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  status: 'LOADING',
  problem: null,
  language: 'javascript',
  codeByLanguage: EMPTY_CODE,
  isRunning: false,
  isSubmitting: false,
  hasSubmitted: false,
  lastResult: null,
  consoleTab: 'results',
  remainingSeconds: 0,

  loadProblem: (id) => {
    clearTimer();
    clearAutosave();
    const problem = getProblemById(id);
    if (!problem) {
      set({ status: 'NOT_FOUND', problem: null });
      return;
    }
    set({
      status: 'READY',
      problem,
      language: 'javascript',
      codeByLanguage: buildInitialCode(problem),
      isRunning: false,
      isSubmitting: false,
      hasSubmitted: false,
      lastResult: null,
      consoleTab: 'results',
      remainingSeconds: problem.timeLimitMinutes * 60,
    });
    timerId = setInterval(() => {
      const remaining = get().remainingSeconds - 1;
      if (remaining <= 0) {
        clearTimer();
        set({ remainingSeconds: 0 });
      } else {
        set({ remainingSeconds: remaining });
      }
    }, 1000);
  },

  setLanguage: (language) => set({ language }),

  setCode: (code) => {
    const { language, problem } = get();
    if (!problem) return;
    set((state) => ({ codeByLanguage: { ...state.codeByLanguage, [language]: code } }));
    clearAutosave();
    autosaveId = setTimeout(() => {
      writeSavedCode(problem.id, language, code);
      autosaveId = null;
    }, 600);
  },

  setConsoleTab: (consoleTab) => set({ consoleTab }),

  run: async () => {
    const { problem, language, codeByLanguage, isRunning } = get();
    if (!problem || isRunning) return;
    set({ isRunning: true, consoleTab: 'results' });
    const result = await runCode(problem, language, codeByLanguage[language]);
    set({ isRunning: false, lastResult: result });
    if (result.status === 'RUNTIME_ERROR') {
      useToastStore.getState().addToast('No solution detected. Write your code first.', 'info');
    } else {
      useToastStore
        .getState()
        .addToast(`Ran ${result.totalCount} tests — ${result.passedCount} passed.`, 'info');
    }
  },

  submit: async () => {
    const { problem, language, codeByLanguage, isSubmitting } = get();
    if (!problem || isSubmitting) return;
    set({ isSubmitting: true, consoleTab: 'results' });
    const result = await runCode(problem, language, codeByLanguage[language]);
    set({ isSubmitting: false, lastResult: result, hasSubmitted: true });
    if (result.status === 'ACCEPTED') {
      useToastStore.getState().addToast('Accepted — all test cases passed!', 'success');
    } else {
      useToastStore
        .getState()
        .addToast(
          `Submission failed — ${result.passedCount}/${result.totalCount} passed.`,
          'error',
        );
    }
  },

  reset: () => {
    clearTimer();
    clearAutosave();
    set({
      status: 'LOADING',
      problem: null,
      language: 'javascript',
      codeByLanguage: EMPTY_CODE,
      isRunning: false,
      isSubmitting: false,
      hasSubmitted: false,
      lastResult: null,
      consoleTab: 'results',
      remainingSeconds: 0,
    });
  },
}));
