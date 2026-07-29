'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';
import { useProblemSocialStore } from '@/store/problem-social.store';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';

const PAGE_SIZE = 20;

export default function BrowsePublicListsPage() {
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);

  const publicLists = useProblemSocialStore((state) => state.publicLists);
  const total = useProblemSocialStore((state) => state.publicListsTotal);
  const isLoading = useProblemSocialStore((state) => state.isLoadingPublicLists);
  const fetchPublicLists = useProblemSocialStore((state) => state.fetchPublicLists);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    void fetchPublicLists(search || undefined, page);
  }, [fetchPublicLists, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Curation"
          title="Browse public lists"
          description="Explore problem lists other candidates have shared, and fork any of them into your own lists."
        />

        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search public lists…"
            className="w-full rounded-md border border-(--color-border-subtle) bg-(--color-surface) py-2 pl-9 pr-3 text-sm text-(--color-text-primary) outline-none transition-colors focus:border-(--color-accent)"
          />
        </div>

        {isLoading && publicLists.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-(--color-text-muted)">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading public lists…
          </div>
        ) : publicLists.length === 0 ? (
          <div className="py-24 text-center text-sm text-(--color-text-muted)">
            No public lists match your search.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {publicLists.map((list) => (
              <Link
                key={list.id}
                href={`/u/${list.author.handle}/lists/${list.id}`}
                className="group flex flex-col gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) transition-colors hover:border-(--color-accent)"
              >
                <h2 className="m-0 font-display text-lg font-semibold tracking-tight text-(--color-text-primary)">
                  {list.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-(--color-text-muted)">
                  <AuthorAvatar name={list.author.name} size="sm" />
                  <span>{list.author.name}</span>
                </div>
                <div className="mt-auto text-xs text-(--color-text-muted)">
                  {list.itemCount} problems
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-md border border-(--color-border-subtle) px-3 py-1.5 text-(--color-text-primary) transition-colors hover:border-(--color-accent) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-(--color-text-muted)">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="rounded-md border border-(--color-border-subtle) px-3 py-1.5 text-(--color-text-primary) transition-colors hover:border-(--color-accent) disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
