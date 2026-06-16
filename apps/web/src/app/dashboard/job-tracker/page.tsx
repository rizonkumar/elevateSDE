'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import type { JobApplicationDto, JobApplicationStatus } from '@elevatesde/shared-types';
import { Navbar } from '@/components/Navbar';
import { useJobTrackerStore, type JobApplicationInput } from '@/store/job-tracker.store';
import { JobColumn } from './_components/JobColumn';
import { JobCardView } from './_components/JobCard';
import { JobFormModal } from './_components/JobFormModal';
import {
  BOARD_COLUMNS,
  isColumnDroppableId,
  statusFromDroppableId,
} from './_components/board';

type GroupedApplications = Record<JobApplicationStatus, JobApplicationDto[]>;

function groupByStatus(applications: JobApplicationDto[]): GroupedApplications {
  const grouped = {
    APPLIED: [],
    OA: [],
    INTERVIEW: [],
    OFFER: [],
    REJECTED: [],
  } as GroupedApplications;
  for (const application of applications) {
    grouped[application.status].push(application);
  }
  for (const column of BOARD_COLUMNS) {
    grouped[column.status].sort((a, b) => a.boardPosition - b.boardPosition);
  }
  return grouped;
}

export default function JobTrackerPage() {
  const {
    applications,
    isLoading,
    isModalOpen,
    editingId,
    load,
    create,
    update,
    move,
    remove,
    openModal,
    closeModal,
  } = useJobTrackerStore();
  const [mounted, setMounted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    load();
  }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const grouped = React.useMemo(() => groupByStatus(applications), [applications]);
  const editingApplication = editingId
    ? applications.find((application) => application.id === editingId) ?? null
    : null;
  const activeApplication = activeId
    ? applications.find((application) => application.id === activeId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeApp = applications.find((application) => application.id === active.id);
    if (!activeApp) {
      return;
    }
    const overId = String(over.id);
    let targetStatus: JobApplicationStatus;
    let targetIndex: number;
    if (isColumnDroppableId(overId)) {
      targetStatus = statusFromDroppableId(overId);
      targetIndex = grouped[targetStatus].length;
    } else {
      const overApp = applications.find((application) => application.id === overId);
      if (!overApp) {
        return;
      }
      targetStatus = overApp.status;
      targetIndex = grouped[targetStatus].findIndex((application) => application.id === overId);
    }
    if (activeApp.status === targetStatus && active.id === over.id) {
      return;
    }
    move(String(active.id), targetStatus, targetIndex);
  };

  const handleSubmit = async (input: JobApplicationInput) => {
    setSubmitting(true);
    const success = editingId ? await update(editingId, input) : await create(input);
    setSubmitting(false);
    if (success) {
      closeModal();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar wide />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
              Job Tracker
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1.5">
              Drag applications across stages to keep your pipeline current.
            </p>
          </div>
          <Button onClick={() => openModal()} className="flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" />
            Add application
          </Button>
        </motion.header>

        {!mounted || isLoading ? (
          <div className="flex items-center justify-center py-24 text-sm text-[var(--color-text-muted)]">
            Loading your applications...
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
              {BOARD_COLUMNS.map((column) => (
                <JobColumn
                  key={column.status}
                  column={column}
                  applications={grouped[column.status]}
                  onEdit={openModal}
                  onDelete={remove}
                />
              ))}
            </div>
            <DragOverlay>
              {activeApplication ? (
                <JobCardView
                  application={activeApplication}
                  onEdit={() => undefined}
                  onDelete={() => undefined}
                  className="shadow-[var(--shadow-soft)] cursor-grabbing"
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      <JobFormModal
        open={isModalOpen}
        initial={editingApplication}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
