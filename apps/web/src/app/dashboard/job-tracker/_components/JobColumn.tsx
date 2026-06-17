'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { JobApplicationDto } from '@elevatesde/shared-types';
import { JobCard } from './JobCard';
import { columnDroppableId, type BoardColumn } from './board';

interface JobColumnProps {
  readonly column: BoardColumn;
  readonly applications: JobApplicationDto[];
  readonly onEdit: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function JobColumn({ column, applications, onEdit, onDelete }: JobColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDroppableId(column.status) });

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex h-9 items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${column.dotClass}`} />
          <span className="truncate text-xs font-semibold uppercase tracking-wider text-(--color-text-primary)">
            {column.label}
          </span>
        </div>
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-(--color-badge-bg) px-1.5 text-xs font-semibold text-(--color-text-muted) tabular-nums">
          {applications.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`mt-2 flex min-h-[200px] flex-1 flex-col gap-2.5 rounded-lg border border-dashed p-2.5 transition-colors ${
          isOver
            ? 'border-(--color-accent) bg-(--color-accent-soft)'
            : 'border-(--color-border-subtle) bg-(--color-bg-soft)'
        }`}
      >
        <SortableContext
          items={applications.map((application) => application.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((application) => (
            <JobCard
              key={application.id}
              application={application}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-6 text-center">
            <span className="text-xs text-(--color-text-muted)">Drop applications here</span>
          </div>
        )}
      </div>
    </div>
  );
}
