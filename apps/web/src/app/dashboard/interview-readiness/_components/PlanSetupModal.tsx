'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Plus, X } from 'lucide-react';
import { Button, DatePicker, Input, Modal, Select } from '@elevatesde/ui';
import type {
  InterviewLoopTemplateDto,
  InterviewPreparationArchetype,
  InterviewRoundType,
  JobApplicationDto,
} from '@elevatesde/shared-types';
import { useInterviewReadinessStore } from '@/store/interview-readiness.store';

interface DraftRound {
  type: InterviewRoundType;
  title: string;
  weight: number;
}

interface PlanSetupModalProps {
  open: boolean;
  onClose: () => void;
  applications: JobApplicationDto[];
  initialApplicationId?: string;
}

const ARCHETYPE_OPTIONS = [
  { value: 'GENERAL', label: 'General software engineering' },
  { value: 'FAANG', label: 'FAANG-style' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

function defaultTarget(application: JobApplicationDto | undefined): string {
  if (application?.interviewDate && new Date(application.interviewDate).getTime() > Date.now()) {
    return application.interviewDate;
  }
  const target = new Date();
  target.setDate(target.getDate() + 14);
  target.setHours(10, 0, 0, 0);
  return target.toISOString();
}

function roundsFromTemplate(template: InterviewLoopTemplateDto | undefined): DraftRound[] {
  return template?.rounds.map(({ type, title, weight }) => ({ type, title, weight })) ?? [];
}

export function PlanSetupModal({
  open,
  onClose,
  applications,
  initialApplicationId,
}: PlanSetupModalProps) {
  const router = useRouter();
  const templates = useInterviewReadinessStore((state) => state.templates);
  const isSaving = useInterviewReadinessStore((state) => state.isSaving);
  const createPlan = useInterviewReadinessStore((state) => state.createPlan);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [applicationId, setApplicationId] = React.useState('');
  const [targetAt, setTargetAt] = React.useState<string | null>(null);
  const [timeZone, setTimeZone] = React.useState('UTC');
  const [archetype, setArchetype] = React.useState<InterviewPreparationArchetype>('GENERAL');
  const [rounds, setRounds] = React.useState<DraftRound[]>([]);

  React.useEffect(() => {
    if (!open) return;
    const selectedId =
      applications.find((application) => application.id === initialApplicationId)?.id ??
      applications[0]?.id ??
      '';
    const selectedApplication = applications.find((application) => application.id === selectedId);
    const template = templates.find((item) => item.archetype === 'GENERAL');
    setStep(1);
    setApplicationId(selectedId);
    setTargetAt(defaultTarget(selectedApplication));
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    setArchetype('GENERAL');
    setRounds(roundsFromTemplate(template));
  }, [applications, initialApplicationId, open, templates]);

  const selectedApplication = applications.find((application) => application.id === applicationId);
  const applicationOptions = applications.map((application) => ({
    value: application.id,
    label: `${application.company} · ${application.role}`,
  }));

  const changeArchetype = (value: string) => {
    const next = value as InterviewPreparationArchetype;
    setArchetype(next);
    setRounds(roundsFromTemplate(templates.find((template) => template.archetype === next)));
  };

  const removeRound = (index: number) => {
    setRounds((current) => current.filter((_, roundIndex) => roundIndex !== index));
  };

  const updateRound = (index: number, patch: Partial<DraftRound>) => {
    setRounds((current) =>
      current.map((round, roundIndex) => (roundIndex === index ? { ...round, ...patch } : round)),
    );
  };

  const create = async () => {
    if (!targetAt || !applicationId || rounds.length === 0) return;
    const planId = await createPlan({
      jobApplicationId: applicationId,
      targetAt,
      timeZone,
      archetype,
      rounds,
    });
    if (planId) {
      onClose();
      router.push(`/dashboard/interview-readiness/${planId}`);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 1 ? 'Build your interview plan' : 'Confirm your interview loop'}
      description={
        step === 1
          ? 'Start from a tracked application, then adjust every assumption.'
          : 'These rounds are editable guidance, not verified company intelligence.'
      }
    >
      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <Select
            label="Tracked application"
            value={applicationId}
            options={applicationOptions}
            onChange={(value) => {
              setApplicationId(value);
              setTargetAt(defaultTarget(applications.find((application) => application.id === value)));
            }}
          />
          <DatePicker label="Interview date and time" value={targetAt} onChange={setTargetAt} withTime />
          <Input
            label="Time zone"
            value={timeZone}
            onChange={(event) => setTimeZone(event.target.value)}
            placeholder="America/New_York"
          />
          <Select
            label="Interview loop template"
            value={archetype}
            options={ARCHETYPE_OPTIONS}
            onChange={changeArchetype}
          />
          <div className="rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-bg-soft) p-4">
            <div className="text-sm font-semibold text-(--color-text-primary)">
              {selectedApplication?.company ?? 'Application'} plan
            </div>
            <p className="mb-0 mt-1 text-xs text-(--color-text-muted)">
              We will prioritize preparation against this deadline and your existing activity.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!applicationId || !targetAt || !timeZone}
            >
              Review rounds
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {rounds.map((round, index) => (
              <div
                key={`${round.type}-${index}`}
                className="grid grid-cols-[1fr_5rem_auto] items-end gap-2 rounded-(--radius-md) border border-(--color-border-subtle) p-3"
              >
                <Input
                  label={index === 0 ? 'Round' : undefined}
                  value={round.title}
                  onChange={(event) => updateRound(index, { title: event.target.value })}
                />
                <Input
                  label={index === 0 ? 'Weight' : undefined}
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={round.weight}
                  onChange={(event) => updateRound(index, { weight: Number(event.target.value) })}
                />
                <button
                  type="button"
                  aria-label={`Remove ${round.title}`}
                  onClick={() => removeRound(index)}
                  className="flex h-10 w-10 items-center justify-center rounded-(--radius-sm) text-(--color-text-muted) transition hover:bg-(--color-danger-soft) hover:text-(--color-danger) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setRounds((current) => [
                ...current,
                { type: 'CUSTOM', title: 'Custom round', weight: 1 },
              ])
            }
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-(--color-accent)"
          >
            <Plus className="h-4 w-4" />
            Add custom round
          </button>
          <div className="rounded-(--radius-md) border border-(--color-accent)/25 bg-(--color-accent-soft) p-4 text-sm text-(--color-text-primary)">
            <div className="flex items-center gap-2 font-semibold">
              <Check className="h-4 w-4 text-(--color-accent)" />
              Ready to generate
            </div>
            <p className="mb-0 mt-1 text-xs">
              The plan will start with usable tasks linked to your coding, review, learning, resume, and mock interview tools.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="tertiary" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={() => void create()}
              disabled={isSaving || rounds.length === 0 || rounds.some((round) => !round.title || round.weight <= 0)}
            >
              {isSaving ? 'Creating…' : 'Create plan'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
