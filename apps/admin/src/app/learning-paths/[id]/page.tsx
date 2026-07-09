'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button, Input } from '@elevatesde/ui';
import type { PathLevel } from '@elevatesde/shared-types';
import { AdminLayout } from '../../../components/AdminLayout';
import { Badge, Toggle, type BadgeVariant } from '../../../components/ui';
import { useLearningPathsStore } from '../../../store/learning-paths.store';
import { ModuleCard } from '../_components/ModuleCard';

const LEVEL_VARIANT: Record<PathLevel, BadgeVariant> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'accent',
  ADVANCED: 'warning',
};

export default function LearningPathBuilderPage() {
  const params = useParams<{ id: string }>();
  const pathId = params.id;

  const active = useLearningPathsStore((state) => state.active);
  const activeLoading = useLearningPathsStore((state) => state.activeLoading);
  const problemOptions = useLearningPathsStore((state) => state.problemOptions);
  const busy = useLearningPathsStore((state) => state.busy);
  const loadPath = useLearningPathsStore((state) => state.loadPath);
  const loadProblemOptions = useLearningPathsStore((state) => state.loadProblemOptions);
  const addModule = useLearningPathsStore((state) => state.addModule);
  const renameModule = useLearningPathsStore((state) => state.renameModule);
  const removeModule = useLearningPathsStore((state) => state.removeModule);
  const reorderModule = useLearningPathsStore((state) => state.reorderModule);
  const addItem = useLearningPathsStore((state) => state.addItem);
  const removeItem = useLearningPathsStore((state) => state.removeItem);
  const reorderItem = useLearningPathsStore((state) => state.reorderItem);
  const toggleActivePublish = useLearningPathsStore((state) => state.toggleActivePublish);

  const [moduleTitle, setModuleTitle] = React.useState('');

  React.useEffect(() => {
    void loadPath(pathId);
    void loadProblemOptions();
  }, [pathId, loadPath, loadProblemOptions]);

  const handleAddModule = () => {
    const title = moduleTitle.trim();
    if (title.length === 0) {
      return;
    }
    void addModule(title);
    setModuleTitle('');
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <Link
          href="/learning-paths"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to learning paths
        </Link>

        {activeLoading && !active ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <span className="animate-pulse text-sm text-(--color-text-muted)">
              Loading builder...
            </span>
          </div>
        ) : !active ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="m-0 text-sm font-medium">Learning path not found</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-(--color-text-primary)">
                    {active.title}
                  </span>
                  <Badge variant={LEVEL_VARIANT[active.level]}>{active.level}</Badge>
                </div>
                <span className="text-xs text-(--color-text-muted)">{active.slug}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-(--color-text-muted)">
                  {active.isPublished ? 'Published' : 'Draft'}
                </span>
                <Toggle
                  checked={active.isPublished}
                  disabled={busy}
                  onChange={(next) => void toggleActivePublish(next)}
                  label="Publish learning path"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {active.modules.length === 0 ? (
                <p className="m-0 rounded-md border border-dashed border-(--color-border-subtle) px-4 py-8 text-center text-sm text-(--color-text-muted)">
                  No modules yet. Add your first module below to start building the track.
                </p>
              ) : (
                active.modules.map((module, index) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    index={index}
                    moduleCount={active.modules.length}
                    problemOptions={problemOptions}
                    busy={busy}
                    onRename={(moduleId, title) => void renameModule(moduleId, title)}
                    onRemove={(moduleId) => void removeModule(moduleId)}
                    onReorder={(moduleId, direction) => void reorderModule(moduleId, direction)}
                    onAddItem={(moduleId, problemId) => void addItem(moduleId, problemId)}
                    onRemoveItem={(itemId) => void removeItem(itemId)}
                    onReorderItem={(itemId, direction) => void reorderItem(itemId, direction)}
                  />
                ))
              )}
            </div>

            <div className="flex items-end gap-2 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-4">
              <Input
                label="New module"
                className="flex-1"
                value={moduleTitle}
                onChange={(event) => setModuleTitle(event.target.value)}
                placeholder="Arrays & Hashing"
              />
              <Button type="button" onClick={handleAddModule} disabled={busy || moduleTitle.trim().length === 0}>
                <Plus className="h-4 w-4 shrink-0" />
                Add module
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
