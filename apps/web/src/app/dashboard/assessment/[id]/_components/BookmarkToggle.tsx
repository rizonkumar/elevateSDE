'use client';

import * as React from 'react';
import { Bookmark } from 'lucide-react';
import { useProblemSocialStore } from '@/store/problem-social.store';

interface BookmarkToggleProps {
  problemId: string;
}

export function BookmarkToggle({ problemId }: Readonly<BookmarkToggleProps>) {
  const bookmarked = useProblemSocialStore(
    (state) => state.bookmarkedProblemIds[problemId] ?? false,
  );
  const toggleBookmark = useProblemSocialStore((state) => state.toggleBookmark);
  const fetchBookmarkState = useProblemSocialStore((state) => state.fetchBookmarkState);

  React.useEffect(() => {
    if (!useProblemSocialStore.getState().hasLoadedBookmarks) {
      void fetchBookmarkState(problemId);
    }
  }, [problemId, fetchBookmarkState]);

  return (
    <button
      type="button"
      onClick={() => toggleBookmark(problemId)}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this problem'}
      title={bookmarked ? 'Bookmarked' : 'Bookmark'}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] ${
        bookmarked
          ? 'border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)'
          : 'border-(--color-border-subtle) text-(--color-text-muted) hover:border-(--color-accent) hover:text-(--color-accent)'
      }`}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
    </button>
  );
}
