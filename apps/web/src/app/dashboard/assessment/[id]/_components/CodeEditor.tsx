'use client';

import Editor, { type OnMount } from '@monaco-editor/react';
import type { AssessmentLanguage } from '@elevatesde/shared-types';
import type { EditorThemePref } from '@/store/assessment-settings.store';
import { useThemeMode } from './useThemeMode';

const MONACO_LANGUAGE: Record<AssessmentLanguage, string> = {
  javascript: 'javascript',
  python: 'python',
  cpp: 'cpp',
};

interface CodeEditorProps {
  language: AssessmentLanguage;
  value: string;
  onChange: (value: string) => void;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  themePref: EditorThemePref;
  onMount?: OnMount;
}

export function CodeEditor({
  language,
  value,
  onChange,
  fontSize,
  tabSize,
  wordWrap,
  themePref,
  onMount,
}: Readonly<CodeEditorProps>) {
  const systemMode = useThemeMode();
  const resolvedMode = themePref === 'system' ? systemMode : themePref;

  return (
    <Editor
      height="100%"
      language={MONACO_LANGUAGE[language]}
      theme={resolvedMode === 'dark' ? 'vs-dark' : 'light'}
      value={value}
      onChange={(next) => onChange(next ?? '')}
      onMount={onMount}
      loading={
        <div className="flex h-full items-center justify-center text-sm text-(--color-text-muted)">
          Loading editor…
        </div>
      }
      options={{
        automaticLayout: true,
        fontSize,
        lineHeight: Math.round(fontSize * 1.6),
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        tabSize,
        wordWrap: wordWrap ? 'on' : 'off',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        renderLineHighlight: 'all',
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
      }}
    />
  );
}
