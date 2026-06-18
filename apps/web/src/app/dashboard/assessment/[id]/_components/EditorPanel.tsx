'use client';

import { Select } from '@elevatesde/ui';
import type { AssessmentLanguage } from '@elevatesde/shared-types';
import { useAssessmentStore } from '@/store/assessment.store';
import { ASSESSMENT_LANGUAGE_OPTIONS } from '@/lib/assessment-problems';
import { CodeEditor } from './CodeEditor';

export function EditorPanel() {
  const language = useAssessmentStore((state) => state.language);
  const code = useAssessmentStore((state) => state.codeByLanguage[state.language]);
  const setLanguage = useAssessmentStore((state) => state.setLanguage);
  const setCode = useAssessmentStore((state) => state.setCode);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-soft)">
      <div className="flex items-center justify-between gap-3 border-b border-(--color-border-subtle) px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-text-muted)">
          Solution
        </span>
        <div className="w-40">
          <Select
            value={language}
            options={ASSESSMENT_LANGUAGE_OPTIONS}
            onChange={(value) => setLanguage(value as AssessmentLanguage)}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor language={language} value={code} onChange={setCode} />
      </div>
    </div>
  );
}
