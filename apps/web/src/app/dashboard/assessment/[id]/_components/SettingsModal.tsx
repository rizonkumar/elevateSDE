'use client';

import * as React from 'react';
import { Modal, Select } from '@elevatesde/ui';
import { Code2, Timer } from 'lucide-react';
import {
  useAssessmentSettingsStore,
  type EditorFontSize,
  type EditorTabSize,
  type EditorThemePref,
  type TimerMode,
} from '@/store/assessment-settings.store';
import { Toggle } from './Toggle';

type Section = 'editor' | 'timer';

const SECTIONS: { id: Section; label: string; icon: typeof Code2 }[] = [
  { id: 'editor', label: 'Code Editor', icon: Code2 },
  { id: 'timer', label: 'Timer', icon: Timer },
];

const FONT_SIZE_OPTIONS = [
  { value: '12', label: '12px' },
  { value: '13', label: '13px' },
  { value: '14', label: '14px' },
  { value: '16', label: '16px' },
];

const TAB_SIZE_OPTIONS = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
];

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const TIMER_MODE_OPTIONS = [
  { value: 'stopwatch', label: 'Stopwatch' },
  { value: 'countdown', label: 'Countdown' },
];

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: Readonly<SettingRowProps>) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-(--color-text-primary)">{label}</div>
        {description && <div className="mt-0.5 text-xs text-(--color-text-muted)">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Readonly<SettingsModalProps>) {
  const settings = useAssessmentSettingsStore();
  const [section, setSection] = React.useState<Section>('editor');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      description="Personalize your editor and timer. Changes save automatically."
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex gap-1.5 sm:w-40 sm:flex-col">
          {SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`inline-flex flex-1 items-center gap-2 rounded-(--radius-lg) px-3 py-2 text-sm font-medium transition-colors cursor-pointer sm:flex-none ${
                  active
                    ? 'bg-(--color-badge-bg) text-(--color-text-primary)'
                    : 'text-(--color-text-muted) hover:text-(--color-text-primary)'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="min-w-0 flex-1 divide-y divide-(--color-border-subtle)">
          {section === 'editor' ? (
            <>
              <SettingRow label="Font size">
                <div className="w-28">
                  <Select
                    value={String(settings.fontSize)}
                    options={FONT_SIZE_OPTIONS}
                    onChange={(value) => settings.setFontSize(Number(value) as EditorFontSize)}
                  />
                </div>
              </SettingRow>
              <SettingRow label="Tab size">
                <div className="w-32">
                  <Select
                    value={String(settings.tabSize)}
                    options={TAB_SIZE_OPTIONS}
                    onChange={(value) => settings.setTabSize(Number(value) as EditorTabSize)}
                  />
                </div>
              </SettingRow>
              <SettingRow label="Word wrap">
                <Toggle checked={settings.wordWrap} onChange={settings.setWordWrap} label="Word wrap" />
              </SettingRow>
              <SettingRow label="Theme">
                <div className="w-32">
                  <Select
                    value={settings.editorTheme}
                    options={THEME_OPTIONS}
                    onChange={(value) => settings.setEditorTheme(value as EditorThemePref)}
                  />
                </div>
              </SettingRow>
            </>
          ) : (
            <>
              <SettingRow label="Default mode" description="Stopwatch counts up; countdown counts down.">
                <div className="w-36">
                  <Select
                    value={settings.defaultTimerMode}
                    options={TIMER_MODE_OPTIONS}
                    onChange={(value) => settings.setDefaultTimerMode(value as TimerMode)}
                  />
                </div>
              </SettingRow>
              <SettingRow
                label="Auto reset"
                description="Reset the timer when a submission is accepted."
              >
                <Toggle
                  checked={settings.autoReset}
                  onChange={settings.setAutoReset}
                  label="Auto reset"
                />
              </SettingRow>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
