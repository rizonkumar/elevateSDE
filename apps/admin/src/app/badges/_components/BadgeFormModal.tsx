'use client';

import * as React from 'react';
import { Button, Input, Modal, Textarea } from '@elevatesde/ui';
import type { AdminBadgeDto, BadgeCriteriaType } from '@elevatesde/shared-types';
import { Select, Toggle } from '../../../components/ui';
import { useBadgesStore, type BadgeFormValues } from '../../../store/badges.store';
import { CRITERIA_OPTIONS } from './badge-criteria';

function toFormValues(badge: AdminBadgeDto | null): BadgeFormValues {
  if (!badge) {
    return {
      key: '',
      name: '',
      description: '',
      icon: 'Award',
      criteriaType: 'PROBLEMS_SOLVED',
      threshold: 1,
      isActive: true,
    };
  }
  return {
    key: badge.key,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    criteriaType: badge.criteriaType,
    threshold: badge.threshold,
    isActive: badge.isActive,
  };
}

export function BadgeFormModal() {
  const isModalOpen = useBadgesStore((state) => state.isModalOpen);
  const editing = useBadgesStore((state) => state.editing);
  const savingId = useBadgesStore((state) => state.savingId);
  const closeModal = useBadgesStore((state) => state.closeModal);
  const saveBadge = useBadgesStore((state) => state.saveBadge);

  const [values, setValues] = React.useState<BadgeFormValues>(() => toFormValues(editing));
  const [showErrors, setShowErrors] = React.useState(false);

  const isEditing = editing !== null;
  const saving = savingId !== null;

  React.useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    setValues(toFormValues(editing));
    setShowErrors(false);
  }, [isModalOpen, editing]);

  const updateValues = (patch: Partial<BadgeFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
  };

  const keyError = showErrors && !values.key.trim() ? 'Key is required.' : undefined;
  const nameError = showErrors && !values.name.trim() ? 'Name is required.' : undefined;

  const handleSubmit = async () => {
    if (!values.key.trim() || !values.name.trim()) {
      setShowErrors(true);
      return;
    }
    await saveBadge(values);
  };

  return (
    <Modal
      open={isModalOpen}
      onClose={closeModal}
      title={isEditing ? 'Edit badge' : 'New badge'}
      description="Define the badge identity and the criteria that automatically awards it."
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={values.name}
            error={nameError}
            onChange={(event) => updateValues({ name: event.target.value })}
            placeholder="e.g. First Blood"
          />
          <Input
            label="Key"
            value={values.key}
            error={keyError}
            disabled={isEditing}
            onChange={(event) => updateValues({ key: event.target.value })}
            placeholder="e.g. first-blood"
          />
        </div>

        <Input
          label="Icon (lucide name or emoji)"
          value={values.icon}
          onChange={(event) => updateValues({ icon: event.target.value })}
          placeholder="e.g. Swords"
        />

        <Textarea
          label="Description"
          value={values.description}
          onChange={(event) => updateValues({ description: event.target.value })}
          className="min-h-[90px]"
          placeholder="Explain how a candidate earns this badge."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
              Criteria
            </span>
            <Select
              value={values.criteriaType}
              options={CRITERIA_OPTIONS}
              onChange={(criteriaType) =>
                updateValues({ criteriaType: criteriaType as BadgeCriteriaType })
              }
            />
          </div>
          <Input
            label="Threshold"
            type="number"
            min={1}
            value={values.threshold}
            onChange={(event) => updateValues({ threshold: Number(event.target.value) || 0 })}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
            Active
          </span>
          <Toggle
            checked={values.isActive}
            onChange={(isActive) => updateValues({ isActive })}
            label="Toggle badge active"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create badge'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
