'use client';

import * as React from 'react';
import { Button, DatePicker, Input, Modal, Select } from '@elevatesde/ui';
import type {
  InterviewPreparationArchetype,
  InterviewPreparationPlanDto,
} from '@elevatesde/shared-types';
import { useInterviewReadinessStore } from '@/store/interview-readiness.store';

interface PlanSettingsModalProps {
  plan: InterviewPreparationPlanDto;
  open: boolean;
  onClose: () => void;
}

const ARCHETYPE_OPTIONS = [
  { value: 'GENERAL', label: 'General software engineering' },
  { value: 'FAANG', label: 'FAANG-style' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

export function PlanSettingsModal({ plan, open, onClose }: PlanSettingsModalProps) {
  const updatePlan = useInterviewReadinessStore((state) => state.updatePlan);
  const updateRound = useInterviewReadinessStore((state) => state.updateRound);
  const isSaving = useInterviewReadinessStore((state) => state.isSaving);
  const [targetAt, setTargetAt] = React.useState<string | null>(plan.targetAt);
  const [timeZone, setTimeZone] = React.useState(plan.timeZone);
  const [archetype, setArchetype] = React.useState<InterviewPreparationArchetype>(plan.archetype);
  const [rounds, setRounds] = React.useState(
    plan.rounds.map((round) => ({ id: round.id, title: round.title, weight: round.weight, version: round.version })),
  );

  React.useEffect(() => {
    if (!open) return;
    setTargetAt(plan.targetAt);
    setTimeZone(plan.timeZone);
    setArchetype(plan.archetype);
    setRounds(plan.rounds.map((round) => ({ id: round.id, title: round.title, weight: round.weight, version: round.version })));
  }, [open, plan]);

  const savePlan = async () => {
    if (!targetAt || !timeZone) return;
    const planSaved = await updatePlan(plan.id, {
      targetAt,
      timeZone,
      archetype,
      version: plan.version,
    });
    if (planSaved) onClose();
  };

  const saveRound = async (draft: (typeof rounds)[number]) => {
    if (!draft.title.trim() || draft.weight <= 0) return;
    await updateRound(draft.id, {
      title: draft.title,
      weight: draft.weight,
      version: draft.version,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Plan settings"
      description="Save plan details and round emphasis independently so each successful change is explicit."
    >
      <div className="flex flex-col gap-5">
        <DatePicker label="Interview date and time" value={targetAt} onChange={setTargetAt} withTime />
        <Input label="Time zone" value={timeZone} onChange={(event) => setTimeZone(event.target.value)} />
        <Select
          label="Interview loop"
          value={archetype}
          options={ARCHETYPE_OPTIONS}
          onChange={(value) => setArchetype(value as InterviewPreparationArchetype)}
        />
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-semibold text-(--color-text-primary)">Round emphasis</legend>
          {rounds.map((round, index) => (
            <div key={round.id} className="grid grid-cols-[1fr_5rem_auto] items-center gap-2">
              <Input
                aria-label={`Round ${index + 1} title`}
                value={round.title}
                onChange={(event) =>
                  setRounds((current) => current.map((item) => item.id === round.id ? { ...item, title: event.target.value } : item))
                }
              />
              <Input
                aria-label={`${round.title} weight`}
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={round.weight}
                onChange={(event) =>
                  setRounds((current) => current.map((item) => item.id === round.id ? { ...item, weight: Number(event.target.value) } : item))
                }
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => void saveRound(round)}
                disabled={isSaving || !round.title.trim() || round.weight <= 0}
              >
                Save round
              </Button>
            </div>
          ))}
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="tertiary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => void savePlan()} disabled={isSaving || !targetAt || !timeZone}>
            {isSaving ? 'Saving…' : 'Save plan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
