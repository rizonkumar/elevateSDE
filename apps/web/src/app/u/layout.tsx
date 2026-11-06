import * as React from 'react';
import Link from 'next/link';
import { PublicProfileTopbar } from '@/components/public-profile/PublicProfileTopbar';

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-(--color-bg-soft)">
      <PublicProfileTopbar />
      {children}
      <footer className="mt-auto border-t border-(--color-border-subtle) bg-(--color-bg)">
        <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-1 px-4 py-6 text-xs text-(--color-text-muted) sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Practice, compete and track your interview prep on ElevateSDE.</span>
          <Link href="/register" className="font-medium text-(--color-accent) hover:underline">
            Create your profile
          </Link>
        </div>
      </footer>
    </div>
  );
}
