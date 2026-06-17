import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-(--color-border-subtle) bg-(--color-bg)">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-(--color-text-muted) sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-(--color-text-primary)">
            Elevate<span className="text-(--color-accent)">SDE</span>
          </span>
          <span className="hidden sm:inline">· © 2026 All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <Link href="/" className="transition-colors hover:text-(--color-accent)">
            Privacy Policy
          </Link>
          <Link href="/" className="transition-colors hover:text-(--color-accent)">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
