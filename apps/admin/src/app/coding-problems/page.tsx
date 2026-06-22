'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { Button, ConfirmDialog, Input } from '@elevatesde/ui';
import { AdminLayout } from '../../components/AdminLayout';
import { Select } from '../../components/ui';
import { useCodingProblemsStore, type DifficultyFilter } from '../../store/coding-problems.store';
import { ProblemDirectory } from './_components/ProblemDirectory';
import { ProblemFormModal } from './_components/ProblemFormModal';

const DIFFICULTY_FILTER_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: 'ALL', label: 'All difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const SEARCH_DEBOUNCE_MS = 350;

export default function CodingProblemsPage() {
  const problems = useCodingProblemsStore((state) => state.problems);
  const loading = useCodingProblemsStore((state) => state.loading);
  const search = useCodingProblemsStore((state) => state.search);
  const difficultyFilter = useCodingProblemsStore((state) => state.difficultyFilter);
  const page = useCodingProblemsStore((state) => state.page);
  const pageSize = useCodingProblemsStore((state) => state.pageSize);
  const total = useCodingProblemsStore((state) => state.total);
  const togglingId = useCodingProblemsStore((state) => state.togglingId);
  const pendingDeleteId = useCodingProblemsStore((state) => state.pendingDeleteId);
  const deletingId = useCodingProblemsStore((state) => state.deletingId);
  const loadProblems = useCodingProblemsStore((state) => state.loadProblems);
  const setSearch = useCodingProblemsStore((state) => state.setSearch);
  const setDifficultyFilter = useCodingProblemsStore((state) => state.setDifficultyFilter);
  const setPage = useCodingProblemsStore((state) => state.setPage);
  const openCreate = useCodingProblemsStore((state) => state.openCreate);
  const openEdit = useCodingProblemsStore((state) => state.openEdit);
  const togglePublish = useCodingProblemsStore((state) => state.togglePublish);
  const requestDelete = useCodingProblemsStore((state) => state.requestDelete);
  const cancelDelete = useCodingProblemsStore((state) => state.cancelDelete);
  const confirmDelete = useCodingProblemsStore((state) => state.confirmDelete);

  const [searchInput, setSearchInput] = React.useState(search);

  React.useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput, search, setSearch]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showInitialLoader = loading && problems.length === 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-(--color-text-muted)">
            Author and curate the DSA problem bank served to candidates.
          </p>
          <span className="text-xs font-semibold text-(--color-text-muted) px-2.5 py-1 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg)">
            {total} problems
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title"
              icon={<Search className="w-4 h-4" />}
              className="sm:max-w-xs"
            />
            <Select
              value={difficultyFilter}
              options={DIFFICULTY_FILTER_OPTIONS}
              onChange={(value) => setDifficultyFilter(value as DifficultyFilter)}
            />
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus className="w-4 h-4 shrink-0" />
            New problem
          </Button>
        </div>

        {showInitialLoader ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <span className="text-sm text-(--color-text-muted) animate-pulse">
              Retrieving coding problems...
            </span>
          </div>
        ) : (
          <>
            <ProblemDirectory
              problems={problems}
              togglingId={togglingId}
              onEdit={openEdit}
              onDelete={requestDelete}
              onTogglePublish={togglePublish}
            />

            {total > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-(--color-text-muted)">
                  Showing {rangeStart}–{rangeEnd} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setPage(page - 1)}
                    disabled={loading || page <= 1}
                    className="px-2.5"
                  >
                    <ChevronLeft className="w-4 h-4 shrink-0" />
                    Previous
                  </Button>
                  <span className="text-xs font-medium text-(--color-text-muted) px-1">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setPage(page + 1)}
                    disabled={loading || page >= totalPages}
                    className="px-2.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ProblemFormModal />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete coding problem"
        description="This permanently removes the problem and its test cases. This action cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </AdminLayout>
  );
}
