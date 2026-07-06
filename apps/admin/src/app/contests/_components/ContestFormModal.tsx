'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { Button, DatePicker, Input, Modal, Textarea } from '@elevatesde/ui';
import type { AdminContestDetailDto } from '@elevatesde/shared-types';
import { Select } from '../../../components/ui';
import type {
  ContestFormProblem,
  ContestFormValues,
  ProblemOption,
} from '../../../store/contests.store';

interface ContestFormModalProps {
  open: boolean;
  saving: boolean;
  editingContest: AdminContestDetailDto | null;
  problemOptions: ProblemOption[];
  onClose: () => void;
  onSave: (values: ContestFormValues) => void;
}

const DEFAULT_POINTS = 100;

export function ContestFormModal({
  open,
  saving,
  editingContest,
  problemOptions,
  onClose,
  onSave,
}: Readonly<ContestFormModalProps>) {
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startsAt, setStartsAt] = React.useState<string | null>(null);
  const [endsAt, setEndsAt] = React.useState<string | null>(null);
  const [problems, setProblems] = React.useState<ContestFormProblem[]>([]);
  const [selectedProblemId, setSelectedProblemId] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      return;
    }
    setTitle(editingContest?.title ?? '');
    setSlug(editingContest?.slug ?? '');
    setDescription(editingContest?.description ?? '');
    setStartsAt(editingContest?.startsAt ?? null);
    setEndsAt(editingContest?.endsAt ?? null);
    setProblems(
      editingContest?.problems.map((problem) => ({
        problemId: problem.problemId,
        points: problem.points,
      })) ?? [],
    );
    setSelectedProblemId('');
  }, [open, editingContest]);

  const problemLabels = React.useMemo(() => {
    const labels = new Map<string, string>();
    for (const option of problemOptions) {
      labels.set(option.value, option.label);
    }
    for (const problem of editingContest?.problems ?? []) {
      if (!labels.has(problem.problemId)) {
        labels.set(problem.problemId, problem.title);
      }
    }
    return labels;
  }, [problemOptions, editingContest]);

  const availableOptions = React.useMemo(() => {
    const chosen = new Set(problems.map((problem) => problem.problemId));
    const options = problemOptions
      .filter((option) => !chosen.has(option.value))
      .map((option) => ({ value: option.value, label: option.label }));
    return [{ value: '', label: 'Select a problem to add' }, ...options];
  }, [problemOptions, problems]);

  const addProblem = () => {
    if (!selectedProblemId) {
      return;
    }
    setProblems((prev) =>
      prev.some((problem) => problem.problemId === selectedProblemId)
        ? prev
        : [...prev, { problemId: selectedProblemId, points: DEFAULT_POINTS }],
    );
    setSelectedProblemId('');
  };

  const removeProblem = (index: number) => {
    setProblems((prev) => prev.filter((_, position) => position !== index));
  };

  const moveProblem = (index: number, direction: -1 | 1) => {
    setProblems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const current = next[index];
      const swapped = next[target];
      if (!current || !swapped) {
        return prev;
      }
      next[index] = swapped;
      next[target] = current;
      return next;
    });
  };

  const setPoints = (index: number, points: number) => {
    setProblems((prev) =>
      prev.map((problem, position) => (position === index ? { ...problem, points } : problem)),
    );
  };

  const canSave =
    title.trim().length > 0 &&
    slug.trim().length > 0 &&
    startsAt !== null &&
    endsAt !== null &&
    !saving;

  const handleSave = () => {
    if (!startsAt || !endsAt) {
      return;
    }
    onSave({
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      startsAt,
      endsAt,
      problems,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingContest ? 'Edit contest' : 'New contest'}
      description="Set the schedule window and assemble problems from the published bank."
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Weekly Sprint #12"
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="weekly-sprint-12"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="A one-hour speed round over three array problems."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker value={startsAt} onChange={setStartsAt} label="Starts at" withTime />
          <DatePicker value={endsAt} onChange={setEndsAt} label="Ends at" withTime />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-(--color-text-muted)">Problems</span>
          <div className="flex items-end gap-2">
            <Select
              className="flex-1"
              value={selectedProblemId}
              options={availableOptions}
              onChange={setSelectedProblemId}
              menuPlacement="top"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addProblem}
              disabled={!selectedProblemId}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Add
            </Button>
          </div>

          {problems.length === 0 ? (
            <p className="m-0 rounded-lg border border-dashed border-(--color-border-subtle) px-3 py-4 text-center text-xs text-(--color-text-muted)">
              No problems added yet. Contests must have at least one problem before publishing.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {problems.map((problem, index) => (
                <li
                  key={problem.problemId}
                  className="flex items-center gap-2 rounded-lg border border-(--color-border-subtle) bg-(--color-bg) px-3 py-2"
                >
                  <span className="w-6 text-center text-xs font-semibold tabular-nums text-(--color-text-muted)">
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate text-sm text-(--color-text-primary)">
                    {problemLabels.get(problem.problemId) ?? problem.problemId}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={problem.points}
                    onChange={(event) => setPoints(index, Number(event.target.value))}
                    aria-label="Points"
                    className="w-20 rounded-lg border border-(--color-border-subtle) bg-(--color-bg) px-2 py-1.5 text-right text-sm tabular-nums text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/30"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="tertiary"
                      className="px-2"
                      disabled={index === 0}
                      onClick={() => moveProblem(index, -1)}
                    >
                      <ArrowUp className="h-4 w-4 shrink-0" />
                    </Button>
                    <Button
                      type="button"
                      variant="tertiary"
                      className="px-2"
                      disabled={index === problems.length - 1}
                      onClick={() => moveProblem(index, 1)}
                    >
                      <ArrowDown className="h-4 w-4 shrink-0" />
                    </Button>
                    <Button
                      type="button"
                      variant="tertiary"
                      className="px-2"
                      onClick={() => removeProblem(index)}
                    >
                      <X className="h-4 w-4 shrink-0" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {editingContest ? 'Save changes' : 'Create contest'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
