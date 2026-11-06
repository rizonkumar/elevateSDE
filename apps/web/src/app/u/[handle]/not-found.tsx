import Link from 'next/link';
import { UserRoundX } from 'lucide-react';

export default function PublicProfileNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-8 text-center shadow-(--shadow-card)">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-(--radius-full) bg-(--color-badge-bg) text-(--color-text-muted)">
          <UserRoundX className="h-5 w-5" />
        </span>
        <div>
          <h1 className="m-0 font-display text-xl font-semibold tracking-tight">
            Profile not available
          </h1>
          <p className="mt-2 mb-0 text-sm text-(--color-text-muted)">
            This profile does not exist or its owner has kept it private.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg) px-3 text-sm font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg)"
        >
          Go to ElevateSDE
        </Link>
      </div>
    </main>
  );
}
