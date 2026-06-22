'use client';

import * as React from 'react';
import { Button, Input, Modal, Tabs, Textarea } from '@elevatesde/ui';
import type {
  AdminCodingProblemDto,
  AssessmentDifficulty,
  AssessmentLanguage,
} from '@elevatesde/shared-types';
import { Select } from '../../../components/ui';
import {
  useCodingProblemsStore,
  type ProblemFormValues,
} from '../../../store/coding-problems.store';
import { TagsInput } from './TagsInput';
import { TestCaseEditor } from './TestCaseEditor';

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const LANGUAGE_TABS: { id: AssessmentLanguage; label: string }[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'cpp', label: 'C++' },
];

const EMPTY_STARTER_CODE: Record<AssessmentLanguage, string> = {
  javascript: '',
  python: '',
  cpp: '',
};

function toFormValues(problem: AdminCodingProblemDto | null): ProblemFormValues {
  if (!problem) {
    return {
      title: '',
      difficulty: 'EASY',
      timeLimitMinutes: 30,
      tags: [],
      description: '',
      constraints: [],
      starterCode: { ...EMPTY_STARTER_CODE },
      testCases: [],
      isPublished: false,
    };
  }
  return {
    title: problem.title,
    difficulty: problem.difficulty,
    timeLimitMinutes: problem.timeLimitMinutes,
    tags: [...problem.tags],
    description: problem.description,
    constraints: [...problem.constraints],
    starterCode: { ...problem.starterCode },
    testCases: problem.testCases.map((testCase) => ({ ...testCase })),
    isPublished: problem.isPublished,
  };
}

export function ProblemFormModal() {
  const isModalOpen = useCodingProblemsStore((state) => state.isModalOpen);
  const editingProblem = useCodingProblemsStore((state) => state.editingProblem);
  const savingId = useCodingProblemsStore((state) => state.savingId);
  const closeModal = useCodingProblemsStore((state) => state.closeModal);
  const saveProblem = useCodingProblemsStore((state) => state.saveProblem);

  const [values, setValues] = React.useState<ProblemFormValues>(() => toFormValues(editingProblem));
  const [activeLanguage, setActiveLanguage] = React.useState<AssessmentLanguage>('javascript');
  const [showErrors, setShowErrors] = React.useState(false);

  const isEditing = editingProblem !== null;

  React.useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    setValues(toFormValues(editingProblem));
    setActiveLanguage('javascript');
    setShowErrors(false);
  }, [isModalOpen, editingProblem]);

  const saving = savingId !== null;
  const titleError = showErrors && !values.title.trim() ? 'Title is required.' : undefined;

  const submitLabel = isEditing ? 'Save changes' : 'Create problem';

  const updateValues = (patch: Partial<ProblemFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  };

  const setStarterCode = (language: AssessmentLanguage, code: string) => {
    setValues((current) => ({
      ...current,
      starterCode: { ...current.starterCode, [language]: code },
    }));
  };

  const handleSubmit = async () => {
    if (!values.title.trim()) {
      setShowErrors(true);
      return;
    }
    await saveProblem(values);
  };

  return (
    <Modal
      open={isModalOpen}
      onClose={closeModal}
      title={isEditing ? 'Edit coding problem' : 'New coding problem'}
      description="Author the problem statement, starter code, and test cases."
    >
      <div className="flex flex-col gap-5">
        <Input
          label="Title"
          value={values.title}
          error={titleError}
          onChange={(event) => updateValues({ title: event.target.value })}
          placeholder="e.g. Two Sum"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
              Difficulty
            </span>
            <Select
              value={values.difficulty}
              options={DIFFICULTY_OPTIONS}
              onChange={(difficulty) =>
                updateValues({ difficulty: difficulty as AssessmentDifficulty })
              }
            />
          </div>
          <Input
            label="Time limit (minutes)"
            type="number"
            min={1}
            value={values.timeLimitMinutes}
            onChange={(event) =>
              updateValues({ timeLimitMinutes: Number(event.target.value) || 0 })
            }
          />
        </div>

        <TagsInput
          label="Tags"
          value={values.tags}
          onChange={(tags) => updateValues({ tags })}
          placeholder="Add a tag and press Enter"
        />

        <Textarea
          label="Description (Markdown)"
          value={values.description}
          onChange={(event) => updateValues({ description: event.target.value })}
          className="min-h-[120px]"
          placeholder="Describe the problem, inputs, and expected output."
        />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
            Starter code
          </span>
          <Tabs
            items={LANGUAGE_TABS}
            value={activeLanguage}
            onChange={(language) => setActiveLanguage(language as AssessmentLanguage)}
          />
          <Textarea
            value={values.starterCode[activeLanguage] ?? ''}
            onChange={(event) => setStarterCode(activeLanguage, event.target.value)}
            className="min-h-[140px] font-mono text-xs"
            placeholder="Starter code for the selected language."
          />
        </div>

        <TestCaseEditor
          testCases={values.testCases}
          onChange={(testCases) => updateValues({ testCases })}
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
