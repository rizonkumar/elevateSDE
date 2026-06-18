'use client';

import * as React from 'react';
import Editor from '@monaco-editor/react';
import type { AssessmentLanguage } from '@elevatesde/shared-types';
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
}

export function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  const mode = useThemeMode();

  return (
    <Editor
      height="100%"
      language={MONACO_LANGUAGE[language]}
      theme={mode === 'dark' ? 'vs-dark' : 'light'}
      value={value}
      onChange={(next) => onChange(next ?? '')}
      loading={
        <div className="flex h-full items-center justify-center text-sm text-(--color-text-muted)">
          Loading editor…
        </div>
      }
      options={{
        automaticLayout: true,
        fontSize: 14,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        tabSize: 2,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        renderLineHighlight: 'all',
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
      }}
    />
  );
}
