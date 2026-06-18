import { create } from 'zustand';

export type EditorFontSize = 12 | 13 | 14 | 16;

export type EditorTabSize = 2 | 4;

export type EditorThemePref = 'system' | 'light' | 'dark';

export type TimerMode = 'stopwatch' | 'countdown';

interface AssessmentSettingsState {
  fontSize: EditorFontSize;
  tabSize: EditorTabSize;
  wordWrap: boolean;
  editorTheme: EditorThemePref;
  defaultTimerMode: TimerMode;
  autoReset: boolean;
  setFontSize: (value: EditorFontSize) => void;
  setTabSize: (value: EditorTabSize) => void;
  setWordWrap: (value: boolean) => void;
  setEditorTheme: (value: EditorThemePref) => void;
  setDefaultTimerMode: (value: TimerMode) => void;
  setAutoReset: (value: boolean) => void;
  reset: () => void;
}

const STORAGE_KEY = 'elevatesde:assessment:settings';

interface PersistedSettings {
  fontSize: EditorFontSize;
  tabSize: EditorTabSize;
  wordWrap: boolean;
  editorTheme: EditorThemePref;
  defaultTimerMode: TimerMode;
  autoReset: boolean;
}

const DEFAULTS: PersistedSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  editorTheme: 'system',
  defaultTimerMode: 'stopwatch',
  autoReset: false,
};

function readSettings(): PersistedSettings {
  if (typeof globalThis.window === 'undefined') return DEFAULTS;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function persist(state: PersistedSettings): void {
  if (typeof globalThis.window === 'undefined') return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

export const useAssessmentSettingsStore = create<AssessmentSettingsState>((set, get) => {
  const commit = () => {
    const { fontSize, tabSize, wordWrap, editorTheme, defaultTimerMode, autoReset } = get();
    persist({ fontSize, tabSize, wordWrap, editorTheme, defaultTimerMode, autoReset });
  };

  return {
    ...readSettings(),
    setFontSize: (fontSize) => {
      set({ fontSize });
      commit();
    },
    setTabSize: (tabSize) => {
      set({ tabSize });
      commit();
    },
    setWordWrap: (wordWrap) => {
      set({ wordWrap });
      commit();
    },
    setEditorTheme: (editorTheme) => {
      set({ editorTheme });
      commit();
    },
    setDefaultTimerMode: (defaultTimerMode) => {
      set({ defaultTimerMode });
      commit();
    },
    setAutoReset: (autoReset) => {
      set({ autoReset });
      commit();
    },
    reset: () => {
      set({ ...DEFAULTS });
      commit();
    },
  };
});
