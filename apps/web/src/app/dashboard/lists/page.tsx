'use client';

import * as React from 'react';
import Link from 'next/link';
import { Reorder } from 'framer-motion';
import {
  Bookmark,
  Check,
  GripVertical,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  type BadgeVariant,
} from '@elevatesde/ui';
import type {
  AssessmentDifficulty,
  ProblemCollectionItemDto,
  ProblemSummaryDto,
} from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useProblemSocialStore } from '@/store/problem-social.store';

const BOOKMARKS_VIEW = '__bookmarks__';

const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const DIFFICULTY_LABEL: Record<AssessmentDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

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

function ProblemItemRow({
  problem,
  onRemove,
  showHandle = false,
}: Readonly<{ problem: ProblemSummaryDto; onRemove: () => void; showHandle?: boolean }>) {
  return (
    <div className="flex items-center gap-3 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) p-3">
      {showHandle && (
        <span
          aria-hidden="true"
          className="inline-flex cursor-grab items-center text-(--color-text-muted) active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/assessment/${problem.id}`}
          className="block truncate text-sm font-semibold text-(--color-text-primary) transition-colors hover:text-(--color-accent)"
        >
          {problem.title}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
            {DIFFICULTY_LABEL[problem.difficulty]}
          </Badge>
          {problem.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${problem.title}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-danger) cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ListsPage() {
  const lists = useProblemSocialStore((state) => state.lists);
  const bookmarks = useProblemSocialStore((state) => state.bookmarks);
  const isLoading = useProblemSocialStore((state) => state.isLoadingLists);
  const hasLoaded = useProblemSocialStore((state) => state.hasLoadedLists);
  const fetchLists = useProblemSocialStore((state) => state.fetchLists);
  const fetchBookmarks = useProblemSocialStore((state) => state.fetchBookmarks);
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
  const [order, setOrder] = React.useState<ProblemCollectionItemDto[]>([]);

  React.useEffect(() => {
    void fetchLists();
    void fetchBookmarks();
  }, [fetchLists, fetchBookmarks]);

  const isBookmarksView = selectedId === BOOKMARKS_VIEW;
  const selected = isBookmarksView ? null : (lists.find((list) => list.id === selectedId) ?? null);

  React.useEffect(() => {
    if (!isBookmarksView && !lists.some((list) => list.id === selectedId)) {
      setSelectedId(BOOKMARKS_VIEW);
    }
  }, [lists, selectedId, isBookmarksView]);

  React.useEffect(() => {
    setOrder(selected?.items ?? []);
    setRenaming(false);
  }, [selected?.id, selected?.items]);

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

  const persistOrder = () => {
    if (selected) {
      void reorderList(
        selected.id,
        order.map((item) => item.problem.id),
      );
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Curation"
          title="My Lists"
          description="Group problems into custom lists you can revisit, reorder, and share."
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

          <section className="min-w-0">
            {isBookmarksView ? (
              <div className="flex flex-col gap-5 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6">
                <div className="flex items-center gap-2.5">
                  <Bookmark className="h-5 w-5 text-(--color-accent)" />
                  <h2 className="m-0 font-display text-xl font-semibold tracking-tight text-(--color-text-primary)">
                    Bookmarked
                  </h2>
                </div>
                {bookmarks.length === 0 ? (
                  <div className="rounded-(--radius-md) border border-dashed border-(--color-border-subtle) px-6 py-12 text-center">
                    <p className="m-0 text-sm text-(--color-text-muted)">
                      No bookmarks yet. Open a problem and tap the bookmark star.
                    </p>
                  </div>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {bookmarks.map((bookmark) => (
                      <li key={bookmark.id}>
                        <ProblemItemRow
                          problem={bookmark.problem}
                          onRemove={() => toggleBookmark(bookmark.problem.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : selected ? (
              <div className="flex flex-col gap-5 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {renaming ? (
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
                  ) : (
                    <div className="flex min-w-0 items-center gap-2.5">
                      <h2 className="m-0 truncate font-display text-xl font-semibold tracking-tight text-(--color-text-primary)">
                        {selected.name}
                      </h2>
                      {selected.isPublic && <Badge variant="accent">Public</Badge>}
                    </div>
                  )}

                  {!renaming && (
                    <div className="flex items-center gap-2">
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
                    </div>
                  )}
                </div>

                {order.length === 0 ? (
                  <div className="rounded-(--radius-md) border border-dashed border-(--color-border-subtle) px-6 py-12 text-center">
                    <p className="m-0 text-sm text-(--color-text-muted)">
                      This list is empty. Open a problem and use “Add to list”.
                    </p>
                  </div>
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={order}
                    onReorder={setOrder}
                    className="m-0 flex list-none flex-col gap-2 p-0"
                  >
                    {order.map((item) => (
                      <Reorder.Item key={item.id} value={item} onDragEnd={persistOrder}>
                        <ProblemItemRow
                          problem={item.problem}
                          onRemove={() => removeProblemFromList(selected.id, item.problem.id)}
                          showHandle
                        />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
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
