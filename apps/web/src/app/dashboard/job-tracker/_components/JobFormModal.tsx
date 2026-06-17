'use client';

import * as React from 'react';
import { Button, Input, Modal, Select } from '@elevatesde/ui';
import type { JobApplicationDto, JobApplicationStatus } from '@elevatesde/shared-types';
import type { JobApplicationInput } from '@/store/job-tracker.store';
import { STATUS_OPTIONS } from './board';

interface JobFormModalProps {
  readonly open: boolean;
  readonly initial: JobApplicationDto | null;
  readonly submitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: JobApplicationInput) => void;
}

interface FormState {
  company: string;
  role: string;
  status: JobApplicationStatus;
  salaryRange: string;
  jobDescriptionUrl: string;
  interviewDate: string;
}

const EMPTY_FORM: FormState = {
  company: '',
  role: '',
  status: 'APPLIED',
  salaryRange: '',
  jobDescriptionUrl: '',
  interviewDate: '',
};

function toDatetimeLocal(value: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromForm(state: FormState): JobApplicationInput {
  return {
    company: state.company.trim(),
    role: state.role.trim(),
    status: state.status,
    salaryRange: state.salaryRange.trim() ? state.salaryRange.trim() : null,
    jobDescriptionUrl: state.jobDescriptionUrl.trim() ? state.jobDescriptionUrl.trim() : null,
    interviewDate: state.interviewDate ? new Date(state.interviewDate).toISOString() : null,
  };
}

export function JobFormModal({ open, initial, submitting, onClose, onSubmit }: JobFormModalProps) {
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<{ company?: string; role?: string }>({});

  React.useEffect(() => {
    if (!open) {
      return;
    }
    if (initial) {
      setForm({
        company: initial.company,
        role: initial.role,
        status: initial.status,
        salaryRange: initial.salaryRange ?? '',
        jobDescriptionUrl: initial.jobDescriptionUrl ?? '',
        interviewDate: toDatetimeLocal(initial.interviewDate),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [open, initial]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { company?: string; role?: string } = {};
    if (!form.company.trim()) {
      nextErrors.company = 'Company is required.';
    }
    if (!form.role.trim()) {
      nextErrors.role = 'Role is required.';
    }
    if (nextErrors.company || nextErrors.role) {
      setErrors(nextErrors);
      return;
    }
    onSubmit(fromForm(form));
  };

  const submitLabel = initial ? 'Save changes' : 'Add application';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit application' : 'Add application'}
      description="Track a role you are pursuing and keep its stage up to date."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Company"
          placeholder="Stripe"
          value={form.company}
          error={errors.company}
          onChange={(event) => {
            setForm((prev) => ({ ...prev, company: event.target.value }));
            if (errors.company) setErrors((prev) => ({ ...prev, company: undefined }));
          }}
          disabled={submitting}
        />
        <Input
          label="Role"
          placeholder="Senior Software Engineer"
          value={form.role}
          error={errors.role}
          onChange={(event) => {
            setForm((prev) => ({ ...prev, role: event.target.value }));
            if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
          }}
          disabled={submitting}
        />
        <Select
          label="Stage"
          value={form.status}
          options={STATUS_OPTIONS}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, status: value as JobApplicationStatus }))
          }
          disabled={submitting}
        />
        <Input
          label="Salary range"
          placeholder="$180k - $220k"
          value={form.salaryRange}
          onChange={(event) => setForm((prev) => ({ ...prev, salaryRange: event.target.value }))}
          disabled={submitting}
        />
        <Input
          label="Job description URL"
          type="url"
          placeholder="https://jobs.example.com/posting/123"
          value={form.jobDescriptionUrl}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, jobDescriptionUrl: event.target.value }))
          }
          disabled={submitting}
        />
        <Input
          label="Interview date"
          type="datetime-local"
          value={form.interviewDate}
          onChange={(event) => setForm((prev) => ({ ...prev, interviewDate: event.target.value }))}
          disabled={submitting}
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
