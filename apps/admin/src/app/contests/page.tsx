'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, ConfirmDialog } from '@elevatesde/ui';
import { AdminLayout } from '../../components/AdminLayout';
import { useContestsStore } from '../../store/contests.store';
import { ContestDirectory } from './_components/ContestDirectory';
import { ContestFormModal } from './_components/ContestFormModal';

export default function ContestsPage() {
  const contests = useContestsStore((state) => state.contests);
  const editingContest = useContestsStore((state) => state.editingContest);
  const problemOptions = useContestsStore((state) => state.problemOptions);
  const loading = useContestsStore((state) => state.loading);
  const isModalOpen = useContestsStore((state) => state.isModalOpen);
  const saving = useContestsStore((state) => state.saving);
  const publishingId = useContestsStore((state) => state.publishingId);
  const pendingDeleteId = useContestsStore((state) => state.pendingDeleteId);
  const deletingId = useContestsStore((state) => state.deletingId);
  const loadContests = useContestsStore((state) => state.loadContests);
  const loadProblemOptions = useContestsStore((state) => state.loadProblemOptions);
  const openCreate = useContestsStore((state) => state.openCreate);
  const openEdit = useContestsStore((state) => state.openEdit);
  const closeModal = useContestsStore((state) => state.closeModal);
  const saveContest = useContestsStore((state) => state.saveContest);
  const togglePublish = useContestsStore((state) => state.togglePublish);
  const requestDelete = useContestsStore((state) => state.requestDelete);
  const cancelDelete = useContestsStore((state) => state.cancelDelete);
  const confirmDelete = useContestsStore((state) => state.confirmDelete);

  React.useEffect(() => {
    void loadContests();
    void loadProblemOptions();
  }, [loadContests, loadProblemOptions]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-(--color-text-muted)">
            Assemble timed contests from the published problem bank and publish them to candidates.
          </p>
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4 shrink-0" />
            New contest
          </Button>
        </div>

        {loading && contests.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <span className="animate-pulse text-sm text-(--color-text-muted)">
              Loading contests...
            </span>
          </div>
        ) : contests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="m-0 text-sm font-medium">No contests yet</p>
            <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">
              Create a contest, attach published problems with points, and publish it when the
              schedule is ready.
            </p>
          </div>
        ) : (
          <ContestDirectory
            contests={contests}
            publishingId={publishingId}
            deletingId={deletingId}
            onEdit={(id) => void openEdit(id)}
            onTogglePublish={(id, publish) => void togglePublish(id, publish)}
            onRequestDelete={requestDelete}
          />
        )}
      </div>

      <ContestFormModal
        open={isModalOpen}
        saving={saving}
        editingContest={editingContest}
        problemOptions={problemOptions}
        onClose={closeModal}
        onSave={(values) => void saveContest(values)}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete contest"
        description="This permanently removes the contest and its attached problems. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </AdminLayout>
  );
}
