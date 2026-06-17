'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '@elevatesde/ui';
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
    <div className="flex flex-col min-w-0">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant={column.badge}>{column.label}</Badge>
        </div>
        <span className="text-xs font-semibold text-(--color-text-muted) tabular-nums">
          {applications.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2.5 rounded-lg border border-dashed p-2.5 min-h-[160px] flex-1 transition-colors ${
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
