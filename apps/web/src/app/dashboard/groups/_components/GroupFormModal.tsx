'use client';

import * as React from 'react';
import { Button, Input, Modal, Textarea } from '@elevatesde/ui';
import { STUDY_GROUP_LIMITS, type StudyGroupJoinPolicy } from '@elevatesde/shared-types';
import { OptionCards } from './OptionCards';

export interface GroupFormValues {
  name: string;
  description: string;
  joinPolicy: StudyGroupJoinPolicy;
}

interface GroupFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: GroupFormValues;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: GroupFormValues) => Promise<boolean>;
}

const EMPTY: GroupFormValues = { name: '', description: '', joinPolicy: 'INVITE_ONLY' };

const POLICY_OPTIONS: { value: StudyGroupJoinPolicy; label: string; description: string }[] = [
  {
    value: 'INVITE_ONLY',
    label: 'Invite only',
    description: 'Owners add members from your organization.',
  },
  {
    value: 'OPEN',
    label: 'Open',
    description: 'Anyone in your organization can find and join.',
  },
];

export function GroupFormModal({
  open,
  mode,
  initial,
  saving,
  onClose,
  onSubmit,
}: Readonly<GroupFormModalProps>) {
  const [values, setValues] = React.useState<GroupFormValues>(initial ?? EMPTY);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setValues(initial ?? EMPTY);
      setError('');
    }
  }, [open, initial]);

  const trimmedName = values.name.trim();

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (trimmedName.length === 0) {
      setError('Give the group a name.');
      return;
    }
    const saved = await onSubmit({ ...values, name: trimmedName, description: values.description.trim() });
    if (saved) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Create a study group' : 'Edit group'}
      description={
        mode === 'create'
          ? 'Bring people together around shared goals. You can add members and goals next.'
          : 'Update how the group is described and who can join.'
      }
    >
      <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col gap-1.5">
          <Input
            label="Name"
            value={values.name}
            maxLength={STUDY_GROUP_LIMITS.nameMaxLength}
            placeholder="e.g. Spring 2027 backend cohort"
            error={error || undefined}
            autoFocus
            onChange={(event) => {
              setValues((current) => ({ ...current, name: event.target.value }));
              setError('');
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Textarea
            label="Description"
            value={values.description}
            maxLength={STUDY_GROUP_LIMITS.descriptionMaxLength}
            placeholder="What is this group working towards?"
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
          />
          <span className="self-end text-xs text-(--color-text-muted)">
            {values.description.length}/{STUDY_GROUP_LIMITS.descriptionMaxLength}
          </span>
        </div>
        <OptionCards
          label="Who can join"
          value={values.joinPolicy}
          options={POLICY_OPTIONS}
          onChange={(joinPolicy) => setValues((current) => ({ ...current, joinPolicy }))}
        />
        <div className="flex flex-col-reverse gap-2 border-t border-(--color-border-subtle) pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || trimmedName.length === 0}>
            {saving ? 'Saving…' : mode === 'create' ? 'Create group' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
