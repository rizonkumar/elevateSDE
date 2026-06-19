'use client';

import * as React from 'react';
import { Select, ConfirmDialog } from '@elevatesde/ui';
import type { OnMount } from '@monaco-editor/react';
import { RotateCcw, WandSparkles, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import type { AssessmentLanguage } from '@elevatesde/shared-types';
import { useAssessmentStore } from '@/store/assessment.store';
import { useAssessmentSettingsStore } from '@/store/assessment-settings.store';
import { useToastStore } from '@/store/toast.store';
import { ASSESSMENT_LANGUAGE_OPTIONS } from '@/lib/assessment-problems';
import { CodeEditor } from './CodeEditor';

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({ label, onClick, children }: Readonly<ToolbarButtonProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-(--radius-sm) text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer"
    >
      {children}
    </button>
  );
}

export function EditorPanel() {
  const language = useAssessmentStore((state) => state.language);
  const code = useAssessmentStore((state) => state.codeByLanguage[state.language]);
  const setLanguage = useAssessmentStore((state) => state.setLanguage);
  const setCode = useAssessmentStore((state) => state.setCode);
  const resetCodeToStarter = useAssessmentStore((state) => state.resetCodeToStarter);
  const editorMaximized = useAssessmentStore((state) => state.editorMaximized);
  const toggleEditorMaximized = useAssessmentStore((state) => state.toggleEditorMaximized);

  const fontSize = useAssessmentSettingsStore((state) => state.fontSize);
  const tabSize = useAssessmentSettingsStore((state) => state.tabSize);
  const wordWrap = useAssessmentSettingsStore((state) => state.wordWrap);
  const editorTheme = useAssessmentSettingsStore((state) => state.editorTheme);

  const addToast = useToastStore((state) => state.addToast);

  const editorRef = React.useRef<Parameters<OnMount>[0] | null>(null);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleFormat = () => {
    const action = editorRef.current?.getAction('editor.action.formatDocument');
    if (!action) {
      addToast('Formatting is not available for this language.', 'info');
      return;
    }
    action.run().catch(() => addToast('Could not format the code.', 'error'));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      addToast('Could not copy to clipboard.', 'error');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card)">
      <div className="flex items-center justify-between gap-3 border-b border-(--color-border-subtle) px-3 py-2">
        <div className="w-40">
          <Select
            value={language}
            options={ASSESSMENT_LANGUAGE_OPTIONS}
            onChange={(value) => setLanguage(value as AssessmentLanguage)}
          />
        </div>
        <div className="flex items-center gap-0.5">
          <ToolbarButton label="Reset to starter code" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Format code" onClick={handleFormat}>
            <WandSparkles className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Copy code" onClick={() => { handleCopy(); }}>
            {copied ? <Check className="h-4 w-4 text-(--color-success)" /> : <Copy className="h-4 w-4" />}
          </ToolbarButton>
          <ToolbarButton
            label={editorMaximized ? 'Restore layout' : 'Maximize editor'}
            onClick={toggleEditorMaximized}
          >
            {editorMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ToolbarButton>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          language={language}
          value={code}
          onChange={setCode}
          fontSize={fontSize}
          tabSize={tabSize}
          wordWrap={wordWrap}
          themePref={editorTheme}
          onMount={handleMount}
        />
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset code?"
        description="This replaces your current solution with the starter template. This cannot be undone."
        confirmLabel="Reset code"
        tone="danger"
        onConfirm={() => {
          resetCodeToStarter();
          setConfirmReset(false);
        }}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}
