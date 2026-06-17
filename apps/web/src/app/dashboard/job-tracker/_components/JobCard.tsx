'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, ExternalLink, GripVertical, Pencil, Trash2, Wallet } from 'lucide-react';
import type { JobApplicationDto } from '@elevatesde/shared-types';

interface JobCardViewProps extends React.HTMLAttributes<HTMLDivElement> {
  application: JobApplicationDto;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

interface JobCardProps {
  readonly application: JobApplicationDto;
  readonly onEdit: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

function formatInterviewDate(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const JobCardView = React.forwardRef<HTMLDivElement, JobCardViewProps>(
  ({ application, onEdit, onDelete, className = '', ...rest }, ref) => {
    const interviewDate = formatInterviewDate(application.interviewDate);

    return (
      <div
        ref={ref}
        className={`rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3.5 shadow-xs transition-shadow hover:shadow-[var(--shadow-soft)] touch-none ${className}`}
        {...rest}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {application.company}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
              {application.role}
            </p>
          </div>
          <span className="shrink-0 -mr-1 -mt-1 p-1 text-[var(--color-text-muted)] cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4" />
          </span>
        </div>

        {(application.salaryRange || interviewDate) && (
          <div className="mt-3 flex flex-col gap-1.5">
            {application.salaryRange && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{application.salaryRange}</span>
              </span>
            )}
            {interviewDate && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {interviewDate}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          {application.jobDescriptionUrl ? (
            <a
              href={application.jobDescriptionUrl}
              target="_blank"
              rel="noreferrer"
              onPointerDown={(event) => event.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Job post
            </a>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">No link</span>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Edit application"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onEdit(application.id)}
              className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-badge-bg)] hover:text-[var(--color-text-primary)] transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Delete application"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onDelete(application.id)}
              className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-rose-500/10 hover:text-rose-500 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  },
);

JobCardView.displayName = 'JobCardView';

export function JobCard({ application, onEdit, onDelete }: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <JobCardView
      ref={setNodeRef}
      style={style}
      application={application}
      onEdit={onEdit}
      onDelete={onDelete}
      {...attributes}
      {...listeners}
    />
  );
}
