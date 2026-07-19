'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button, ConfirmDialog } from '@elevatesde/ui';
import { AdminLayout } from '../../components/AdminLayout';
import {
  useLearningPathsStore,
  type LearningPathFormValues,
} from '../../store/learning-paths.store';
import { LearningPathDirectory } from './_components/LearningPathDirectory';
import { LearningPathFormModal } from './_components/LearningPathFormModal';

export default function LearningPathsPage() {
  const router = useRouter();
  const paths = useLearningPathsStore((state) => state.paths);
  const editingPath = useLearningPathsStore((state) => state.editingPath);
  const loading = useLearningPathsStore((state) => state.loading);
  const isModalOpen = useLearningPathsStore((state) => state.isModalOpen);
  const saving = useLearningPathsStore((state) => state.saving);
  const publishingId = useLearningPathsStore((state) => state.publishingId);
  const pendingDeleteId = useLearningPathsStore((state) => state.pendingDeleteId);
  const deletingId = useLearningPathsStore((state) => state.deletingId);
  const loadPaths = useLearningPathsStore((state) => state.loadPaths);
  const openCreate = useLearningPathsStore((state) => state.openCreate);
  const openEdit = useLearningPathsStore((state) => state.openEdit);
  const closeModal = useLearningPathsStore((state) => state.closeModal);
  const savePath = useLearningPathsStore((state) => state.savePath);
  const togglePublish = useLearningPathsStore((state) => state.togglePublish);
  const requestDelete = useLearningPathsStore((state) => state.requestDelete);
  const cancelDelete = useLearningPathsStore((state) => state.cancelDelete);
  const confirmDelete = useLearningPathsStore((state) => state.confirmDelete);

  React.useEffect(() => {
    void loadPaths();
  }, [loadPaths]);

  const handleSave = async (values: LearningPathFormValues) => {
    const createdId = await savePath(values);
    if (createdId) {
      router.push(`/learning-paths/${createdId}`);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-(--color-text-muted)">
            Curate ordered prep tracks from the published problem bank and publish them to
            candidates.
          </p>
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4 shrink-0" />
            New path
          </Button>
        </div>

        {loading && paths.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <span className="animate-pulse text-sm text-(--color-text-muted)">
              Loading learning paths...
            </span>
          </div>
        ) : paths.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="m-0 text-sm font-medium">No learning paths yet</p>
            <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">
              Create a path, add modules with problems in the builder, and publish it when it is
              ready.
            </p>
          </div>
        ) : (
          <LearningPathDirectory
            paths={paths}
            publishingId={publishingId}
            deletingId={deletingId}
            onEdit={(id) => void openEdit(id)}
            onTogglePublish={(id, publish) => void togglePublish(id, publish)}
            onRequestDelete={requestDelete}
          />
        )}
      </div>

      <LearningPathFormModal
        open={isModalOpen}
        saving={saving}
        editingPath={editingPath}
        onClose={closeModal}
        onSave={(values) => void handleSave(values)}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete learning path"
        description="This permanently removes the path, its modules, and enrollments. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </AdminLayout>
  );
}
