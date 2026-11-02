import { create } from 'zustand';
import { ASSESSMENT_LANGUAGES, type AssessmentLanguage } from '@elevatesde/shared-types';

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
  preferredLanguage: AssessmentLanguage;
  setFontSize: (value: EditorFontSize) => void;
  setTabSize: (value: EditorTabSize) => void;
  setWordWrap: (value: boolean) => void;
  setEditorTheme: (value: EditorThemePref) => void;
  setDefaultTimerMode: (value: TimerMode) => void;
  setAutoReset: (value: boolean) => void;
  setPreferredLanguage: (value: AssessmentLanguage) => void;
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
  preferredLanguage: AssessmentLanguage;
}

const DEFAULTS: PersistedSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  editorTheme: 'system',
  defaultTimerMode: 'stopwatch',
  autoReset: false,
  preferredLanguage: 'javascript',
};

function isLanguage(value: unknown): value is AssessmentLanguage {
  return typeof value === 'string' && (ASSESSMENT_LANGUAGES as readonly string[]).includes(value);
}

function readSettings(): PersistedSettings {
  if (globalThis.window === undefined) return DEFAULTS;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    const merged = { ...DEFAULTS, ...parsed };
    return isLanguage(merged.preferredLanguage)
      ? merged
      : { ...merged, preferredLanguage: DEFAULTS.preferredLanguage };
  } catch {
    return DEFAULTS;
  }
}

function persist(state: PersistedSettings): void {
  if (globalThis.window === undefined) return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

export const useAssessmentSettingsStore = create<AssessmentSettingsState>((set, get) => {
  const commit = () => {
    const {
      fontSize,
      tabSize,
      wordWrap,
      editorTheme,
      defaultTimerMode,
      autoReset,
      preferredLanguage,
    } = get();
    persist({
      fontSize,
      tabSize,
      wordWrap,
      editorTheme,
      defaultTimerMode,
      autoReset,
      preferredLanguage,
    });
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
    setPreferredLanguage: (preferredLanguage) => {
      set({ preferredLanguage });
      commit();
    },
    reset: () => {
      set({ ...DEFAULTS });
      commit();
    },
  };
});
