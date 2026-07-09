'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button, Input } from '@elevatesde/ui';
import type {
  AdminLearningPathModuleDto,
  AssessmentDifficulty,
} from '@elevatesde/shared-types';
import { Badge, Select, type BadgeVariant } from '../../../components/ui';
import type { ProblemOption } from '../../../store/learning-paths.store';

const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'accent',
  HARD: 'danger',
};

interface ModuleCardProps {
  module: AdminLearningPathModuleDto;
  index: number;
  moduleCount: number;
  problemOptions: ProblemOption[];
  busy: boolean;
  onRename: (moduleId: string, title: string) => void;
  onRemove: (moduleId: string) => void;
  onReorder: (moduleId: string, direction: 'up' | 'down') => void;
  onAddItem: (moduleId: string, problemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onReorderItem: (itemId: string, direction: 'up' | 'down') => void;
}

export function ModuleCard({
  module,
  index,
  moduleCount,
  problemOptions,
  busy,
  onRename,
  onRemove,
  onReorder,
  onAddItem,
  onRemoveItem,
  onReorderItem,
}: Readonly<ModuleCardProps>) {
  const [editing, setEditing] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(module.title);
  const [selectedProblemId, setSelectedProblemId] = React.useState('');

  React.useEffect(() => {
    setDraftTitle(module.title);
  }, [module.title]);

  const usedProblemIds = new Set(module.items.map((item) => item.problemId));
  const availableOptions = [
    { value: '', label: 'Add a published problem' },
    ...problemOptions.filter((option) => !usedProblemIds.has(option.value)),
  ];

  const commitRename = () => {
    const next = draftTitle.trim();
    if (next.length > 0 && next !== module.title) {
      onRename(module.id, next);
    }
    setEditing(false);
  };

  const handleAdd = () => {
    if (!selectedProblemId) {
      return;
    }
    onAddItem(module.id, selectedProblemId);
    setSelectedProblemId('');
  };

  return (
    <div className="flex flex-col gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-4">
      <div className="flex items-center justify-between gap-3">
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Module title"
            />
            <Button type="button" variant="secondary" className="px-2.5" onClick={commitRename}>
              <Check className="h-4 w-4 shrink-0" />
            </Button>
            <Button
              type="button"
              variant="tertiary"
              className="px-2.5"
              onClick={() => {
                setDraftTitle(module.title);
                setEditing(false);
              }}
            >
              <X className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-(--color-text-primary)">
              {module.title}
            </span>
            <span className="text-xs text-(--color-text-muted)">
              {module.items.length} problems
            </span>
          </div>
        )}
        {!editing && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="tertiary"
              className="px-2"
              disabled={busy || index === 0}
              onClick={() => onReorder(module.id, 'up')}
            >
              <ArrowUp className="h-4 w-4 shrink-0" />
            </Button>
            <Button
              type="button"
              variant="tertiary"
              className="px-2"
              disabled={busy || index === moduleCount - 1}
              onClick={() => onReorder(module.id, 'down')}
            >
              <ArrowDown className="h-4 w-4 shrink-0" />
            </Button>
            <Button
              type="button"
              variant="tertiary"
              className="px-2"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4 shrink-0" />
            </Button>
            <Button
              type="button"
              variant="tertiary"
              className="px-2"
              disabled={busy}
              onClick={() => onRemove(module.id)}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        )}
      </div>

      {module.items.length === 0 ? (
        <p className="m-0 rounded-lg border border-dashed border-(--color-border-subtle) px-3 py-4 text-center text-xs text-(--color-text-muted)">
          No problems yet. Add published problems to this module.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {module.items.map((item, itemIndex) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-(--color-border-subtle) bg-(--color-bg) px-3 py-2"
            >
              <span className="w-6 text-center text-xs font-semibold tabular-nums text-(--color-text-muted)">
                {itemIndex + 1}
              </span>
              <span className="flex-1 truncate text-sm text-(--color-text-primary)">
                {item.title}
              </span>
              <Badge variant={DIFFICULTY_VARIANT[item.difficulty]}>{item.difficulty}</Badge>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="tertiary"
                  className="px-2"
                  disabled={busy || itemIndex === 0}
                  onClick={() => onReorderItem(item.id, 'up')}
                >
                  <ArrowUp className="h-4 w-4 shrink-0" />
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  className="px-2"
                  disabled={busy || itemIndex === module.items.length - 1}
                  onClick={() => onReorderItem(item.id, 'down')}
                >
                  <ArrowDown className="h-4 w-4 shrink-0" />
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  className="px-2"
                  disabled={busy}
                  onClick={() => onRemoveItem(item.id)}
                >
                  <X className="h-4 w-4 shrink-0" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <Select
          className="flex-1"
          value={selectedProblemId}
          options={availableOptions}
          onChange={setSelectedProblemId}
          disabled={busy}
        />
        <Button type="button" variant="secondary" onClick={handleAdd} disabled={busy || !selectedProblemId}>
          <Plus className="h-4 w-4 shrink-0" />
          Add
        </Button>
      </div>
    </div>
  );
}
