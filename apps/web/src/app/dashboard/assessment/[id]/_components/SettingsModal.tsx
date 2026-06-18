'use client';

import * as React from 'react';
import { Modal } from '@elevatesde/ui';
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

const SECTION_OPTIONS: readonly { value: Section; label: string }[] = [
  { value: 'editor', label: 'Code Editor' },
  { value: 'timer', label: 'Timer' },
];

const FONT_SIZE_OPTIONS: readonly { value: EditorFontSize; label: string }[] = [
  { value: 12, label: '12' },
  { value: 13, label: '13' },
  { value: 14, label: '14' },
  { value: 16, label: '16' },
];

const TAB_SIZE_OPTIONS: readonly { value: EditorTabSize; label: string }[] = [
  { value: 2, label: '2' },
  { value: 4, label: '4' },
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

function Row({
  label,
  description,
  children,
}: Readonly<{ label: string; description?: string; children: React.ReactNode }>) {
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
    <Modal open={open} onClose={onClose} title="Settings" description="Changes are saved automatically.">
      <div className="space-y-3">
        <SegmentedControl
          value={section}
          options={SECTION_OPTIONS}
          onChange={setSection}
          ariaLabel="Settings section"
        />

        <div className="min-h-52">
          {section === 'editor' ? (
            <div className="divide-y divide-(--color-border-subtle)">
              <Row label="Font size">
                <SegmentedControl
                  value={settings.fontSize}
                  options={FONT_SIZE_OPTIONS}
                  onChange={settings.setFontSize}
                  ariaLabel="Font size"
                />
              </Row>
              <Row label="Tab size">
                <SegmentedControl
                  value={settings.tabSize}
                  options={TAB_SIZE_OPTIONS}
                  onChange={settings.setTabSize}
                  ariaLabel="Tab size"
                />
              </Row>
              <Row label="Theme">
                <SegmentedControl
                  value={settings.editorTheme}
                  options={THEME_OPTIONS}
                  onChange={settings.setEditorTheme}
                  ariaLabel="Theme"
                />
              </Row>
              <Row label="Word wrap">
                <Toggle checked={settings.wordWrap} onChange={settings.setWordWrap} label="Word wrap" />
              </Row>
            </div>
          ) : (
            <div className="divide-y divide-(--color-border-subtle)">
              <Row label="Default mode">
                <SegmentedControl
                  value={settings.defaultTimerMode}
                  options={TIMER_MODE_OPTIONS}
                  onChange={settings.setDefaultTimerMode}
                  ariaLabel="Default timer mode"
                />
              </Row>
              <Row label="Auto reset" description="Reset the timer when a submission is accepted.">
                <Toggle checked={settings.autoReset} onChange={settings.setAutoReset} label="Auto reset" />
              </Row>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
