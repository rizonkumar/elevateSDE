'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button, Textarea } from '@elevatesde/ui';
import type { AssessmentTestCase } from '@elevatesde/shared-types';
import { Toggle } from '../../../components/ui';

interface TestCaseEditorProps {
  testCases: AssessmentTestCase[];
  onChange: (next: AssessmentTestCase[]) => void;
}

export function TestCaseEditor({ testCases, onChange }: Readonly<TestCaseEditorProps>) {
  const addTestCase = () => {
    const next: AssessmentTestCase = {
      id: crypto.randomUUID(),
      input: '',
      expectedOutput: '',
      isHidden: false,
    };
    onChange([...testCases, next]);
  };

  const updateTestCase = (id: string, patch: Partial<AssessmentTestCase>) => {
    onChange(testCases.map((testCase) => (testCase.id === id ? { ...testCase, ...patch } : testCase)));
  };

  const removeTestCase = (id: string) => {
    onChange(testCases.filter((testCase) => testCase.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-(--color-text-primary)">Test cases</span>
        <Button type="button" variant="secondary" onClick={addTestCase} className="h-8 px-2.5 text-xs">
          <Plus className="w-3.5 h-3.5 shrink-0" />
          Add case
        </Button>
      </div>

      {testCases.length === 0 ? (
        <p className="text-xs text-(--color-text-muted) rounded-sm border border-dashed border-(--color-border-subtle) px-3 py-4 text-center">
          No test cases yet. Add at least one to evaluate submissions.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {testCases.map((testCase, index) => (
            <div
              key={testCase.id}
              className="flex flex-col gap-3 rounded-sm border border-(--color-border-subtle) bg-(--color-bg-soft) p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  Case {index + 1}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-(--color-text-muted)">
                    Hidden
                    <Toggle
                      checked={testCase.isHidden}
                      onChange={(next) => updateTestCase(testCase.id, { isHidden: next })}
                      label={`Toggle hidden for case ${index + 1}`}
                    />
                  </label>
                  <button
                    type="button"
                    aria-label={`Remove case ${index + 1}`}
                    onClick={() => removeTestCase(testCase.id)}
                    className="p-1.5 rounded-md text-(--color-text-muted) hover:bg-(--color-danger-soft) hover:text-(--color-danger) transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Textarea
                  label="Input"
                  value={testCase.input}
                  onChange={(event) => updateTestCase(testCase.id, { input: event.target.value })}
                  className="min-h-[64px] font-mono text-xs"
                />
                <Textarea
                  label="Expected output"
                  value={testCase.expectedOutput}
                  onChange={(event) => updateTestCase(testCase.id, { expectedOutput: event.target.value })}
                  className="min-h-[64px] font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
