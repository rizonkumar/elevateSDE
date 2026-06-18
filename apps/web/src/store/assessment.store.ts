import { create } from 'zustand';
import type { AssessmentLanguage, AssessmentRunResultDto } from '@elevatesde/shared-types';
import { useToastStore } from '@/store/toast.store';
import { useAssessmentSettingsStore, type TimerMode } from '@/store/assessment-settings.store';
import { runCode } from '@/lib/code-runner';
import {
  ASSESSMENT_LANGUAGE_OPTIONS,
  getProblemById,
  type AssessmentProblemSeed,
} from '@/lib/assessment-problems';

export type AssessmentStatus = 'LOADING' | 'READY' | 'NOT_FOUND';

export type TestcaseTab = 'testcase' | 'result';

export type TimerStatus = 'idle' | 'running' | 'paused';

interface AssessmentState {
  status: AssessmentStatus;
  problem: AssessmentProblemSeed | null;
  language: AssessmentLanguage;
  codeByLanguage: Record<AssessmentLanguage, string>;
  isRunning: boolean;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  lastResult: AssessmentRunResultDto | null;
  testcaseTab: TestcaseTab;
  activeCaseIndex: number;
  caseInputs: string[];
  timerMode: TimerMode;
  timerStatus: TimerStatus;
  elapsedSeconds: number;
  remainingSeconds: number;
  countdownMinutes: number;
  editorMaximized: boolean;
  loadProblem: (id: string) => void;
  setLanguage: (language: AssessmentLanguage) => void;
  setCode: (code: string) => void;
  resetCodeToStarter: () => void;
  setTestcaseTab: (tab: TestcaseTab) => void;
  setActiveCaseIndex: (index: number) => void;
  setCaseInput: (index: number, value: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setTimerMode: (mode: TimerMode) => void;
  setCountdownMinutes: (minutes: number) => void;
  toggleEditorMaximized: () => void;
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
  if (globalThis.window === undefined) return null;
  try {
    return globalThis.localStorage.getItem(storageKey(problemId, language));
  } catch {
    return null;
  }
}

function writeSavedCode(problemId: string, language: AssessmentLanguage, code: string): void {
  if (globalThis.window === undefined) return;
  try {
    globalThis.localStorage.setItem(storageKey(problemId, language), code);
  } catch {
    return;
  }
}

function removeSavedCode(problemId: string, language: AssessmentLanguage): void {
  if (globalThis.window === undefined) return;
  try {
    globalThis.localStorage.removeItem(storageKey(problemId, language));
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

function visibleInputs(problem: AssessmentProblemSeed): string[] {
  return problem.testCases.filter((testCase) => !testCase.isHidden).map((testCase) => testCase.input);
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

export const useAssessmentStore = create<AssessmentState>((set, get) => {
  const tick = () => {
    const { timerMode, remainingSeconds } = get();
    if (timerMode === 'stopwatch') {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
      return;
    }
    const next = remainingSeconds - 1;
    if (next <= 0) {
      clearTimer();
      set({ remainingSeconds: 0, timerStatus: 'idle' });
      useToastStore.getState().addToast('Time is up.', 'info');
    } else {
      set({ remainingSeconds: next });
    }
  };

  const beginInterval = () => {
    clearTimer();
    timerId = setInterval(tick, 1000);
  };

  return {
    status: 'LOADING',
    problem: null,
    language: 'javascript',
    codeByLanguage: EMPTY_CODE,
    isRunning: false,
    isSubmitting: false,
    hasSubmitted: false,
    lastResult: null,
    testcaseTab: 'testcase',
    activeCaseIndex: 0,
    caseInputs: [],
    timerMode: 'stopwatch',
    timerStatus: 'idle',
    elapsedSeconds: 0,
    remainingSeconds: 0,
    countdownMinutes: 30,
    editorMaximized: false,

    loadProblem: (id) => {
      clearTimer();
      clearAutosave();
      const problem = getProblemById(id);
      if (!problem) {
        set({ status: 'NOT_FOUND', problem: null });
        return;
      }
      const mode = useAssessmentSettingsStore.getState().defaultTimerMode;
      set({
        status: 'READY',
        problem,
        language: 'javascript',
        codeByLanguage: buildInitialCode(problem),
        isRunning: false,
        isSubmitting: false,
        hasSubmitted: false,
        lastResult: null,
        testcaseTab: 'testcase',
        activeCaseIndex: 0,
        caseInputs: visibleInputs(problem),
        timerMode: mode,
        timerStatus: 'idle',
        elapsedSeconds: 0,
        countdownMinutes: problem.timeLimitMinutes,
        remainingSeconds: problem.timeLimitMinutes * 60,
        editorMaximized: false,
      });
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

    resetCodeToStarter: () => {
      const { language, problem } = get();
      if (!problem) return;
      clearAutosave();
      removeSavedCode(problem.id, language);
      set((state) => ({
        codeByLanguage: { ...state.codeByLanguage, [language]: problem.starterCode[language] },
      }));
      useToastStore.getState().addToast('Code reset to the starter template.', 'info');
    },

    setTestcaseTab: (testcaseTab) => set({ testcaseTab }),

    setActiveCaseIndex: (activeCaseIndex) => set({ activeCaseIndex }),

    setCaseInput: (index, value) =>
      set((state) => ({
        caseInputs: state.caseInputs.map((input, position) => (position === index ? value : input)),
      })),

    startTimer: () => {
      if (get().timerStatus === 'running') return;
      set({ timerStatus: 'running' });
      beginInterval();
    },

    pauseTimer: () => {
      if (get().timerStatus !== 'running') return;
      clearTimer();
      set({ timerStatus: 'paused' });
    },

    resumeTimer: () => {
      if (get().timerStatus !== 'paused') return;
      set({ timerStatus: 'running' });
      beginInterval();
    },

    resetTimer: () => {
      clearTimer();
      const { countdownMinutes } = get();
      set({
        timerStatus: 'idle',
        elapsedSeconds: 0,
        remainingSeconds: countdownMinutes * 60,
      });
    },

    setTimerMode: (timerMode) => {
      clearTimer();
      const { countdownMinutes } = get();
      set({
        timerMode,
        timerStatus: 'idle',
        elapsedSeconds: 0,
        remainingSeconds: countdownMinutes * 60,
      });
    },

    setCountdownMinutes: (minutes) => {
      const countdownMinutes = Math.max(1, Math.min(180, Math.round(minutes)));
      set({ countdownMinutes });
      if (get().timerStatus === 'idle') {
        set({ remainingSeconds: countdownMinutes * 60 });
      }
    },

    toggleEditorMaximized: () => set((state) => ({ editorMaximized: !state.editorMaximized })),

    run: async () => {
      const { problem, language, codeByLanguage, caseInputs, isRunning } = get();
      if (!problem || isRunning) return;
      set({ isRunning: true, testcaseTab: 'result' });
      const result = await runCode(problem, language, codeByLanguage[language], caseInputs);
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
      const { problem, language, codeByLanguage, caseInputs, isSubmitting } = get();
      if (!problem || isSubmitting) return;
      set({ isSubmitting: true, testcaseTab: 'result' });
      const result = await runCode(problem, language, codeByLanguage[language], caseInputs);
      set({ isSubmitting: false, lastResult: result, hasSubmitted: true });
      if (result.status === 'ACCEPTED') {
        useToastStore.getState().addToast('Accepted — all test cases passed!', 'success');
        if (useAssessmentSettingsStore.getState().autoReset) {
          get().resetTimer();
        }
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
        testcaseTab: 'testcase',
        activeCaseIndex: 0,
        caseInputs: [],
        timerMode: 'stopwatch',
        timerStatus: 'idle',
        elapsedSeconds: 0,
        remainingSeconds: 0,
        countdownMinutes: 30,
        editorMaximized: false,
      });
    },
  };
});
