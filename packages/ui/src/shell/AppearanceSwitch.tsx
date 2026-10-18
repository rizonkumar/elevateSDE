'use client';

import type { ShellIcon } from './types';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';
import { useTheme } from './use-theme';
import type { ThemePreference } from './use-theme';

const OPTIONS: { value: ThemePreference; label: string; icon: ShellIcon }[] = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
];

export function AppearanceSwitch() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-sm text-(--color-text-muted)">Theme</span>
      <div
        role="radiogroup"
        aria-label="Theme"
        className="inline-flex items-center gap-0.5 rounded-(--radius-sm) bg-(--color-tab-bg) p-0.5"
      >
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = option.value === preference;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              onClick={() => setPreference(option.value)}
              className={`flex h-7 w-8 items-center justify-center rounded-[4px] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--color-accent) ${
                selected
                  ? 'bg-(--color-tab-active) text-(--color-text-primary) shadow-(--shadow-card)'
                  : 'text-(--color-text-disabled) hover:text-(--color-text-primary)'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
