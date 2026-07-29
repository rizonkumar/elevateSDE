import Link from 'next/link';
import { UserX } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export default function PublicProfileNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-(--color-bg) text-(--color-text-primary)">
      <Navbar />
      <main className="mx-auto flex w-full max-w-(--page-max-width) flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
          <UserX className="h-6 w-6" />
        </span>
        <h1 className="m-0 font-display text-2xl font-semibold tracking-tight">
          Profile not found
        </h1>
        <p className="m-0 max-w-md text-sm text-(--color-text-muted)">
          This profile does not exist, or its owner has kept it private.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-10 items-center justify-center rounded-(--radius-sm) bg-(--color-text-primary) px-4 text-sm font-medium text-(--color-bg) transition-opacity hover:opacity-90"
        >
          Back to ElevateSDE
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
