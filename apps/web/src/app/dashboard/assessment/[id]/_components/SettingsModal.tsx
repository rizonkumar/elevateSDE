'use client';

import * as React from 'react';
import { Modal } from '@elevatesde/ui';
import { Code2, Timer } from 'lucide-react';
import {
  useAssessmentSettingsStore,
  type EditorFontSize,
  type EditorTabSize,
  type EditorThemePref,
  type TimerMode,
} from '@/store/assessment-settings.store';
import { Toggle } from './Toggle';
import { SegmentedControl } from './SegmentedControl';

type Section = 'editor' | 'timer';

const SECTIONS: { id: Section; label: string; icon: typeof Code2 }[] = [
  { id: 'editor', label: 'Code Editor', icon: Code2 },
  { id: 'timer', label: 'Timer', icon: Timer },
];

const FONT_SIZE_OPTIONS: readonly { value: EditorFontSize; label: string }[] = [
  { value: 12, label: '12' },
  { value: 13, label: '13' },
  { value: 14, label: '14' },
  { value: 16, label: '16' },
];

const TAB_SIZE_OPTIONS: readonly { value: EditorTabSize; label: string }[] = [
  { value: 2, label: '2 spaces' },
  { value: 4, label: '4 spaces' },
];

const THEME_OPTIONS: readonly { value: EditorThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const TIMER_MODE_OPTIONS: readonly { value: TimerMode; label: string }[] = [
  { value: 'stopwatch', label: 'Stopwatch' },
  { value: 'countdown', label: 'Countdown' },
];

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-(--color-text-primary)">{label}</div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: Readonly<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-(--color-text-primary)">{label}</div>
        {description && <div className="mt-0.5 text-xs text-(--color-text-muted)">{description}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
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
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex gap-1.5 sm:w-44 sm:shrink-0 sm:flex-col">
          {SECTIONS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`inline-flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer sm:flex-none ${
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

        <div className="min-h-72 min-w-0 flex-1 space-y-5">
          {section === 'editor' ? (
            <>
              <Field label="Font size">
                <SegmentedControl
                  value={settings.fontSize}
                  options={FONT_SIZE_OPTIONS}
                  onChange={settings.setFontSize}
                  ariaLabel="Font size"
                />
              </Field>
              <Field label="Tab size">
                <SegmentedControl
                  value={settings.tabSize}
                  options={TAB_SIZE_OPTIONS}
                  onChange={settings.setTabSize}
                  ariaLabel="Tab size"
                />
              </Field>
              <Field label="Theme">
                <SegmentedControl
                  value={settings.editorTheme}
                  options={THEME_OPTIONS}
                  onChange={settings.setEditorTheme}
                  ariaLabel="Theme"
                />
              </Field>
              <ToggleRow
                label="Word wrap"
                checked={settings.wordWrap}
                onChange={settings.setWordWrap}
              />
            </>
          ) : (
            <>
              <Field label="Default mode">
                <SegmentedControl
                  value={settings.defaultTimerMode}
                  options={TIMER_MODE_OPTIONS}
                  onChange={settings.setDefaultTimerMode}
                  ariaLabel="Default timer mode"
                />
              </Field>
              <ToggleRow
                label="Auto reset"
                description="Reset the timer when a submission is accepted."
                checked={settings.autoReset}
                onChange={settings.setAutoReset}
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
