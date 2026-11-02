'use client';

import * as React from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import type { TopicDto } from '@elevatesde/shared-types';

interface TermRowProps {
  term: TopicDto;
  saving: boolean;
  onRename: (name: string) => Promise<boolean>;
  onDelete: () => void;
}

export function TermRow({ term, saving, onRename, onDelete }: Readonly<TermRowProps>) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(term.name);

  React.useEffect(() => {
    if (!editing) {
      setDraft(term.name);
    }
  }, [term.name, editing]);

  const submit = async () => {
    const name = draft.trim();
    if (!name || name === term.name) {
      setEditing(false);
      return;
    }
    if (await onRename(name)) {
      setEditing(false);
    }
  };

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {editing ? (
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={60}
            aria-label={`Rename ${term.name}`}
            className="h-9 flex-1 rounded-sm border border-(--color-border-subtle) bg-(--color-bg-soft) px-3 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
          />
          <button
            type="submit"
            disabled={saving}
            aria-label="Save name"
            className="cursor-pointer rounded-sm p-1.5 text-(--color-accent) transition-colors hover:bg-(--color-badge-bg) disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label="Cancel rename"
            className="cursor-pointer rounded-sm p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg)"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-medium text-(--color-text-primary)">
              {term.name}
            </p>
            <p className="m-0 font-mono text-xs text-(--color-text-muted)">{term.slug}</p>
          </div>
          <span className="shrink-0 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) px-2.5 py-0.5 text-xs font-semibold text-(--color-text-muted)">
            {term.problemCount} {term.problemCount === 1 ? 'problem' : 'problems'}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Rename ${term.name}`}
            className="cursor-pointer rounded-sm p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            aria-label={`Delete ${term.name}`}
            className="cursor-pointer rounded-sm p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-danger) disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </li>
  );
}
