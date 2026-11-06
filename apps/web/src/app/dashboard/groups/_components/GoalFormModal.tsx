'use client';

import * as React from 'react';
import { Button, DatePicker, Input, Modal, Select } from '@elevatesde/ui';
import {
  STUDY_GROUP_LIMITS,
  type StudyGoalMetric,
  type StudyGoalScope,
  type StudyGroupGoalDto,
  type StudyGroupGoalInput,
} from '@elevatesde/shared-types';
import { METRIC_META } from '@/lib/study-group-labels';
import { OptionCards } from './OptionCards';

interface GoalFormModalProps {
  open: boolean;
  goal: StudyGroupGoalDto | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: StudyGroupGoalInput) => Promise<boolean>;
}

interface GoalFormState {
  title: string;
  metric: StudyGoalMetric;
  scope: StudyGoalScope;
  target: string;
  startsAt: string | null;
  endsAt: string | null;
}

const METRIC_OPTIONS = (Object.keys(METRIC_META) as StudyGoalMetric[]).map((metric) => ({
  value: metric,
  label: METRIC_META[metric].label,
}));

const SCOPE_OPTIONS: { value: StudyGoalScope; label: string; description: string }[] = [
  {
    value: 'GROUP_TOTAL',
    label: 'Group total',
    description: 'Everyone contributes to one shared number.',
  },
  {
    value: 'EACH_MEMBER',
    label: 'Each member',
    description: 'Every member works towards the target on their own.',
  },
];

const DAY_MS = 86_400_000;

function blankState(): GoalFormState {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return {
    title: '',
    metric: 'PROBLEMS_SOLVED',
    scope: 'GROUP_TOTAL',
    target: '50',
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 30 * DAY_MS).toISOString(),
  };
}

function fromGoal(goal: StudyGroupGoalDto): GoalFormState {
  return {
    title: goal.title,
    metric: goal.metric,
    scope: goal.scope,
    target: String(goal.target),
    startsAt: goal.startsAt,
    endsAt: goal.endsAt,
  };
}

function validate(state: GoalFormState): string | null {
  const target = Number(state.target);
  if (state.title.trim().length === 0) {
    return 'Give the goal a title.';
  }
  if (!Number.isInteger(target) || target < 1) {
    return 'The target must be a whole number of at least 1.';
  }
  if (target > STUDY_GROUP_LIMITS.goalTargetMax) {
    return `The target can be at most ${STUDY_GROUP_LIMITS.goalTargetMax.toLocaleString()}.`;
  }
  if (!state.startsAt || !state.endsAt) {
    return 'Choose a start and an end date.';
  }
  if (new Date(state.endsAt).getTime() <= new Date(state.startsAt).getTime()) {
    return 'The goal must end after it starts.';
  }
  return null;
}

function goalSubmitLabel(saving: boolean, editing: boolean): string {
  if (saving) {
    return 'Saving…';
  }
  return editing ? 'Save goal' : 'Add goal';
}

export function GoalFormModal({
  open,
  goal,
  saving,
  onClose,
  onSubmit,
}: Readonly<GoalFormModalProps>) {
  const [state, setState] = React.useState<GoalFormState>(blankState);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setState(goal ? fromGoal(goal) : blankState());
      setError(null);
    }
  }, [open, goal]);

  const update = (patch: Partial<GoalFormState>) => {
    setState((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const problem = validate(state);
    if (problem || !state.startsAt || !state.endsAt) {
      setError(problem ?? 'Choose a start and an end date.');
      return;
    }
    const saved = await onSubmit({
      title: state.title.trim(),
      metric: state.metric,
      scope: state.scope,
      target: Number(state.target),
      startsAt: state.startsAt,
      endsAt: state.endsAt,
    });
    if (saved) {
      onClose();
    }
  };

  const unit = METRIC_META[state.metric].unit;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? 'Edit goal' : 'Add a goal'}
      description="Progress is counted from activity between the start and end dates."
    >
      <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
        <Input
          label="Title"
          value={state.title}
          maxLength={STUDY_GROUP_LIMITS.goalTitleMaxLength}
          placeholder="e.g. 200 problems before interviews start"
          autoFocus
          onChange={(event) => update({ title: event.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Measure"
            value={state.metric}
            options={METRIC_OPTIONS}
            onChange={(value) => update({ metric: value as StudyGoalMetric })}
          />
          <Input
            label={`Target (${unit})`}
            type="number"
            inputMode="numeric"
            min={1}
            max={STUDY_GROUP_LIMITS.goalTargetMax}
            value={state.target}
            onChange={(event) => update({ target: event.target.value })}
          />
        </div>
        <OptionCards
          label="How progress counts"
          value={state.scope}
          options={SCOPE_OPTIONS}
          onChange={(scope) => update({ scope })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker label="Starts" value={state.startsAt} onChange={(value) => update({ startsAt: value })} />
          <DatePicker label="Ends" value={state.endsAt} onChange={(value) => update({ endsAt: value })} />
        </div>
        {error && (
          <p role="alert" className="m-0 text-sm text-(--color-danger)">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-(--color-border-subtle) pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {goalSubmitLabel(saving, goal !== null)}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
