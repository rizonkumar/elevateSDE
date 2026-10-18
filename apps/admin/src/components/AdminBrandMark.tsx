import Link from 'next/link';

interface AdminBrandMarkProps {
  compact: boolean;
}

export function AdminBrandMark({ compact }: AdminBrandMarkProps) {
  return (
    <Link
      href="/"
      aria-label="ElevateSDE Admin home"
      className="flex items-center gap-2.5 rounded-(--radius-sm) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) bg-(--color-accent) text-sm font-bold text-white">
        E
      </span>
      {!compact && (
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-tight text-(--color-text-primary)">
            Elevate<span className="text-(--color-accent)">SDE</span>
          </span>
          <span className="rounded-[4px] border border-(--color-border-subtle) px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-(--color-text-muted)">
            Admin
          </span>
        </span>
      )}
    </Link>
  );
}
