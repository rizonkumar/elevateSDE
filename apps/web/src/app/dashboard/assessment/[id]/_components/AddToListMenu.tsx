'use client';

import * as React from 'react';
import { Check, ListPlus, Loader2, Plus } from 'lucide-react';
import { Input } from '@elevatesde/ui';
import type { ProblemCollectionDto } from '@elevatesde/shared-types';
import { useProblemSocialStore } from '@/store/problem-social.store';

interface AddToListMenuProps {
  problemId: string;
}

export function AddToListMenu({ problemId }: Readonly<AddToListMenuProps>) {
  const lists = useProblemSocialStore((state) => state.lists);
  const hasLoadedLists = useProblemSocialStore((state) => state.hasLoadedLists);
  const isLoadingLists = useProblemSocialStore((state) => state.isLoadingLists);
  const fetchLists = useProblemSocialStore((state) => state.fetchLists);
  const createList = useProblemSocialStore((state) => state.createList);
  const addProblemToList = useProblemSocialStore((state) => state.addProblemToList);
  const removeProblemFromList = useProblemSocialStore((state) => state.removeProblemFromList);

  const [open, setOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open && !hasLoadedLists) {
      void fetchLists();
    }
  }, [open, hasLoadedLists, fetchLists]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const isInList = (list: ProblemCollectionDto) =>
    list.items.some((item) => item.problem.id === problemId);

  const submitNewList = async () => {
    const created = await createList(newName);
    if (created) {
      await addProblemToList(created.id, problemId);
      setNewName('');
    }
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitNewList();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Add to a list"
        title="Add to list"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--color-border-subtle) text-(--color-text-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent) cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)]"
      >
        <ListPlus className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) p-2 shadow-(--shadow-modal)">
          <p className="m-0 px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-text-muted)">
            Add to list
          </p>
          <div className="max-h-52 overflow-y-auto">
            {isLoadingLists && lists.length === 0 ? (
              <div className="flex items-center gap-2 px-2 py-2 text-sm text-(--color-text-muted)">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : lists.length === 0 ? (
              <p className="m-0 px-2 py-2 text-sm text-(--color-text-muted)">
                No lists yet. Create one below.
              </p>
            ) : (
              lists.map((list) => {
                const added = isInList(list);
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() =>
                      added
                        ? removeProblemFromList(list.id, problemId)
                        : addProblemToList(list.id, problemId)
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-(--radius-sm) px-2 py-2 text-left text-sm text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
                  >
                    <span className="truncate">{list.name}</span>
                    {added && <Check className="h-4 w-4 shrink-0 text-(--color-accent)" />}
                  </button>
                );
              })
            )}
          </div>
          <form
            onSubmit={handleCreate}
            className="mt-1 flex items-center gap-2 border-t border-(--color-border-subtle) pt-2"
          >
            <Input
              placeholder="New list name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={120}
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              aria-label="Create list and add problem"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-sm) border border-(--color-border-subtle) text-(--color-text-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent) cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
