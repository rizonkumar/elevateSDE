'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import type { AdminProblemCompanyInput, TopicDto } from '@elevatesde/shared-types';
import { Select } from '../../../components/ui';

const MAX_COMPANIES = 20;
const DEFAULT_FREQUENCY = 50;

interface CompanyFrequencyEditorProps {
  companies: TopicDto[];
  value: AdminProblemCompanyInput[];
  onChange: (companies: AdminProblemCompanyInput[]) => void;
}

function clampFrequency(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  return Math.min(100, Math.max(1, Math.round(raw)));
}

export function CompanyFrequencyEditor({
  companies,
  value,
  onChange,
}: Readonly<CompanyFrequencyEditorProps>) {
  const used = new Set(value.map((entry) => entry.companyId));
  const firstUnused = companies.find((company) => !used.has(company.id));

  const update = (index: number, patch: Partial<AdminProblemCompanyInput>) => {
    onChange(value.map((entry, position) => (position === index ? { ...entry, ...patch } : entry)));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
            Companies
          </span>
          <p className="m-0 text-xs text-(--color-text-muted)">
            Frequency 1–100 ranks the problem on each company list.
          </p>
        </div>
        <button
          type="button"
          disabled={!firstUnused || value.length >= MAX_COMPANIES}
          onClick={() => {
            if (firstUnused) {
              onChange([...value, { companyId: firstUnused.id, frequency: DEFAULT_FREQUENCY }]);
            }
          }}
          className="inline-flex cursor-pointer items-center gap-1 rounded-(--radius-sm) px-2 py-1 text-xs font-semibold text-(--color-accent) transition-colors hover:bg-(--color-badge-bg) disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5 shrink-0" />
          Add company
        </button>
      </div>
      {companies.length === 0 && (
        <p className="m-0 rounded-(--radius-sm) border border-dashed border-(--color-border-subtle) p-3 text-xs text-(--color-text-muted)">
          No companies exist yet.{' '}
          <Link href="/taxonomy" className="font-semibold text-(--color-accent)">
            Create companies
          </Link>{' '}
          first.
        </p>
      )}
      {value.map((entry, index) => {
        const options = companies
          .filter((company) => company.id === entry.companyId || !used.has(company.id))
          .map((company) => ({ value: company.id, label: company.name }));
        return (
          <div key={entry.companyId} className="flex items-center gap-2">
            <Select
              value={entry.companyId}
              options={options}
              onChange={(companyId) => update(index, { companyId })}
              className="flex-1"
            />
            <input
              type="number"
              min={1}
              max={100}
              value={entry.frequency}
              aria-label="Frequency"
              onChange={(event) =>
                update(index, { frequency: clampFrequency(Number(event.target.value)) })
              }
              className="h-9 w-20 rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) px-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
            />
            <button
              type="button"
              aria-label="Remove company"
              onClick={() => onChange(value.filter((_, position) => position !== index))}
              className="cursor-pointer rounded-(--radius-sm) p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
