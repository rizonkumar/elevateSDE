'use client';

import * as React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, ConfirmDialog, Input } from '@elevatesde/ui';
import { AdminLayout } from '../../components/AdminLayout';
import { Select } from '../../components/ui';
import { useCodingProblemsStore } from '../../store/coding-problems.store';
import { ProblemDirectory } from './_components/ProblemDirectory';
import { ProblemFormModal } from './_components/ProblemFormModal';

const DIFFICULTY_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All difficulties' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

export default function CodingProblemsPage() {
  const problems = useCodingProblemsStore((state) => state.problems);
  const loading = useCodingProblemsStore((state) => state.loading);
  const search = useCodingProblemsStore((state) => state.search);
  const difficultyFilter = useCodingProblemsStore((state) => state.difficultyFilter);
  const togglingId = useCodingProblemsStore((state) => state.togglingId);
  const pendingDeleteId = useCodingProblemsStore((state) => state.pendingDeleteId);
  const deletingId = useCodingProblemsStore((state) => state.deletingId);
  const loadProblems = useCodingProblemsStore((state) => state.loadProblems);
  const setSearch = useCodingProblemsStore((state) => state.setSearch);
  const setDifficultyFilter = useCodingProblemsStore((state) => state.setDifficultyFilter);
  const openCreate = useCodingProblemsStore((state) => state.openCreate);
  const openEdit = useCodingProblemsStore((state) => state.openEdit);
  const requestDelete = useCodingProblemsStore((state) => state.requestDelete);
  const cancelDelete = useCodingProblemsStore((state) => state.cancelDelete);
  const confirmDelete = useCodingProblemsStore((state) => state.confirmDelete);

  React.useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const filteredProblems = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return problems.filter((problem) => {
      const matchesQuery = query === '' || problem.title.toLowerCase().includes(query);
      const matchesDifficulty =
        difficultyFilter === 'ALL' || problem.difficulty === difficultyFilter;
      return matchesQuery && matchesDifficulty;
    });
  }, [problems, search, difficultyFilter]);

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-(--color-text-muted) animate-pulse">
            Retrieving coding problems...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-(--color-text-muted)">
              Author and curate the DSA problem bank served to candidates.
            </p>
            <span className="text-xs font-semibold text-(--color-text-muted) px-2.5 py-1 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg)">
              {problems.length} problems
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title"
                icon={<Search className="w-4 h-4" />}
                className="sm:max-w-xs"
              />
              <Select
                value={difficultyFilter}
                options={DIFFICULTY_FILTER_OPTIONS}
                onChange={(value) =>
                  setDifficultyFilter(value as (typeof DIFFICULTY_FILTER_OPTIONS)[number]['value'])
                }
              />
            </div>
            <Button type="button" onClick={openCreate}>
              <Plus className="w-4 h-4 shrink-0" />
              New problem
            </Button>
          </div>

          <ProblemDirectory
            problems={filteredProblems}
            togglingId={togglingId}
            onEdit={openEdit}
            onDelete={requestDelete}
            onTogglePublish={useCodingProblemsStore.getState().togglePublish}
          />
        </div>
      )}

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
