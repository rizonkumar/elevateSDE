'use client';

import * as React from 'react';
import { Bookmark, Check, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Badge, Button, ConfirmDialog, Input, Modal } from '@elevatesde/ui';
import type { ProblemSummaryDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useProblemSocialStore } from '@/store/problem-social.store';
import { ListOverviewCard } from './_components/ListOverviewCard';
import { QuestionsPanel } from './_components/QuestionsPanel';

const BOOKMARKS_VIEW = '__bookmarks__';

function SidebarEntry({
  label,
  count,
  icon: Icon,
  active,
  onSelect,
  badge,
}: Readonly<{
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onSelect: () => void;
  badge?: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-(--radius-md) border px-3.5 py-3 text-left transition-colors cursor-pointer ${
        active
          ? 'border-(--color-accent) bg-(--color-accent-soft)'
          : 'border-(--color-border-subtle) bg-(--color-surface) hover:border-(--color-accent)'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0 text-(--color-text-muted)" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-(--color-text-primary)">
            {label}
          </span>
          <span className="mt-0.5 block text-xs text-(--color-text-muted)">
            {count} {count === 1 ? 'problem' : 'problems'}
          </span>
        </span>
      </span>
      {badge}
    </button>
  );
}

export default function ListsPage() {
  const lists = useProblemSocialStore((state) => state.lists);
  const bookmarks = useProblemSocialStore((state) => state.bookmarks);
  const solvedProblemIds = useProblemSocialStore((state) => state.solvedProblemIds);
  const isLoading = useProblemSocialStore((state) => state.isLoadingLists);
  const hasLoaded = useProblemSocialStore((state) => state.hasLoadedLists);
  const fetchLists = useProblemSocialStore((state) => state.fetchLists);
  const fetchBookmarks = useProblemSocialStore((state) => state.fetchBookmarks);
  const fetchSolvedProblemIds = useProblemSocialStore((state) => state.fetchSolvedProblemIds);
  const createList = useProblemSocialStore((state) => state.createList);
  const renameList = useProblemSocialStore((state) => state.renameList);
  const deleteList = useProblemSocialStore((state) => state.deleteList);
  const removeProblemFromList = useProblemSocialStore((state) => state.removeProblemFromList);
  const reorderList = useProblemSocialStore((state) => state.reorderList);
  const toggleBookmark = useProblemSocialStore((state) => state.toggleBookmark);

  const [selectedId, setSelectedId] = React.useState<string>(BOOKMARKS_VIEW);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [renaming, setRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    void fetchLists();
    void fetchBookmarks();
    void fetchSolvedProblemIds();
  }, [fetchLists, fetchBookmarks, fetchSolvedProblemIds]);

  const solvedSet = React.useMemo(() => new Set(solvedProblemIds), [solvedProblemIds]);

  const isBookmarksView = selectedId === BOOKMARKS_VIEW;
  const selected = isBookmarksView ? null : (lists.find((list) => list.id === selectedId) ?? null);

  React.useEffect(() => {
    if (!isBookmarksView && !lists.some((list) => list.id === selectedId)) {
      setSelectedId(BOOKMARKS_VIEW);
    }
  }, [lists, selectedId, isBookmarksView]);

  React.useEffect(() => {
    setRenaming(false);
  }, [selectedId]);

  const submitCreate = async () => {
    const created = await createList(newName);
    if (created) {
      setNewName('');
      setCreating(false);
      setSelectedId(created.id);
    }
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitCreate();
  };

  const submitRename = () => {
    if (selected && renameValue.trim()) {
      void renameList(selected.id, renameValue);
    }
    setRenaming(false);
  };

  const bookmarkProblems: ProblemSummaryDto[] = bookmarks.map((bookmark) => bookmark.problem);
  const listProblems: ProblemSummaryDto[] = selected?.items.map((item) => item.problem) ?? [];

  const renameNode = (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Input
        value={renameValue}
        onChange={(event) => setRenameValue(event.target.value)}
        maxLength={120}
        autoFocus
      />
      <button
        type="button"
        onClick={submitRename}
        aria-label="Save name"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--color-border-subtle) text-(--color-accent) transition-colors hover:bg-(--color-accent-soft) cursor-pointer"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setRenaming(false)}
        aria-label="Cancel rename"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--color-border-subtle) text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Curation"
          title="My Lists"
          description="Group problems into custom lists you can revisit, reorder, and track your progress on."
          actions={
            <Button
              onClick={() => {
                setNewName('');
                setCreating(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New list
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <aside className="flex flex-col gap-2">
            <SidebarEntry
              label="Bookmarked"
              count={bookmarks.length}
              icon={Bookmark}
              active={isBookmarksView}
              onSelect={() => setSelectedId(BOOKMARKS_VIEW)}
            />
            <div className="my-1 h-px bg-(--color-border-subtle)" />
            {isLoading && lists.length === 0 ? (
              <p className="m-0 px-1 text-sm text-(--color-text-muted)">Loading your lists…</p>
            ) : lists.length === 0 ? (
              <p className="m-0 px-1 text-sm text-(--color-text-muted)">
                No lists yet. Create one, then add problems from any problem page.
              </p>
            ) : (
              lists.map((list) => (
                <SidebarEntry
                  key={list.id}
                  label={list.name}
                  count={list.itemCount}
                  icon={ListChecks}
                  active={list.id === selectedId}
                  onSelect={() => setSelectedId(list.id)}
                  badge={list.isPublic ? <Badge variant="accent">Public</Badge> : undefined}
                />
              ))
            )}
          </aside>

          <section className="flex min-w-0 flex-col gap-6">
            {isBookmarksView ? (
              <>
                <ListOverviewCard
                  icon={Bookmark}
                  titleNode={
                    <h2 className="m-0 truncate font-display text-xl font-semibold tracking-tight text-(--color-text-primary)">
                      Bookmarked
                    </h2>
                  }
                  problems={bookmarkProblems}
                  solvedSet={solvedSet}
                />
                <QuestionsPanel
                  problems={bookmarkProblems}
                  solvedSet={solvedSet}
                  onRemove={(problemId) => toggleBookmark(problemId)}
                  emptyMessage="No bookmarks yet. Open a problem and tap the bookmark star."
                />
              </>
            ) : selected ? (
              <>
                <ListOverviewCard
                  icon={ListChecks}
                  titleNode={
                    renaming ? (
                      renameNode
                    ) : (
                      <div className="flex min-w-0 items-center gap-2.5">
                        <h2 className="m-0 truncate font-display text-xl font-semibold tracking-tight text-(--color-text-primary)">
                          {selected.name}
                        </h2>
                        {selected.isPublic && <Badge variant="accent">Public</Badge>}
                      </div>
                    )
                  }
                  actions={
                    renaming ? undefined : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRenameValue(selected.name);
                            setRenaming(true);
                          }}
                          aria-label="Rename list"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border-subtle) text-(--color-text-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent) cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          aria-label="Delete list"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border-subtle) text-(--color-text-muted) transition-colors hover:border-(--color-danger) hover:text-(--color-danger) cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )
                  }
                  problems={listProblems}
                  solvedSet={solvedSet}
                />
                <QuestionsPanel
                  problems={listProblems}
                  solvedSet={solvedSet}
                  onRemove={(problemId) => removeProblemFromList(selected.id, problemId)}
                  emptyMessage="This list is empty. Open a problem and use “Add to list”."
                  reorderable
                  onReorder={(orderedProblemIds) => reorderList(selected.id, orderedProblemIds)}
                />
              </>
            ) : (
              <div className="rounded-md border border-dashed border-(--color-border-subtle) bg-(--color-surface) px-6 py-16 text-center">
                <p className="m-0 text-sm text-(--color-text-muted)">
                  {hasLoaded ? 'Select a list to view its problems.' : 'Loading…'}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create a list"
        description="Give your list a short, memorable name."
      >
        <form className="flex flex-col gap-5" onSubmit={handleCreate}>
          <Input
            label="List name"
            placeholder="e.g. Graph problems to revisit"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={120}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!newName.trim()}>
              Create list
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this list?"
        description="The list and its ordering will be removed. Your bookmarks and notes are not affected."
        confirmLabel="Delete list"
        tone="danger"
        onConfirm={() => {
          if (selected) {
            void deleteList(selected.id);
          }
          setConfirmDelete(false);
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </PageContainer>
  );
}
