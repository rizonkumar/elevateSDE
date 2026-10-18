import * as React from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeSnapshot {
  preference: ThemePreference;
  resolved: ResolvedTheme;
}

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const SERVER_SNAPSHOT: ThemeSnapshot = { preference: 'system', resolved: 'dark' };

const listeners = new Set<() => void>();
let snapshot: ThemeSnapshot | null = null;

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function computeSnapshot(preference: ThemePreference): ThemeSnapshot {
  return {
    preference,
    resolved: preference === 'system' ? systemTheme() : preference,
  };
}

function emit(next: ThemeSnapshot) {
  snapshot = next;
  document.documentElement.setAttribute('data-theme', next.resolved);
  listeners.forEach((listener) => listener());
}

function handleSystemChange() {
  if (readPreference() === 'system') emit(computeSnapshot('system'));
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.matchMedia(DARK_QUERY).addEventListener('change', handleSystemChange);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.matchMedia(DARK_QUERY).removeEventListener('change', handleSystemChange);
    }
  };
}

function getSnapshot(): ThemeSnapshot {
  if (!snapshot) snapshot = computeSnapshot(readPreference());
  return snapshot;
}

function getServerSnapshot(): ThemeSnapshot {
  return SERVER_SNAPSHOT;
}

export function setThemePreference(preference: ThemePreference) {
  if (preference === 'system') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, preference);
  }
  emit(computeSnapshot(preference));
}

export function useTheme() {
  const current = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = React.useCallback(() => {
    setThemePreference(current.resolved === 'dark' ? 'light' : 'dark');
  }, [current.resolved]);

  return {
    preference: current.preference,
    resolved: current.resolved,
    setPreference: setThemePreference,
    toggle,
  };
}
