import Link from 'next/link';

interface BrandMarkProps {
  compact: boolean;
}

export function BrandMark({ compact }: BrandMarkProps) {
  return (
    <Link
      href="/dashboard"
      aria-label="ElevateSDE home"
      className="flex items-center gap-2.5 rounded-(--radius-sm) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) bg-(--color-accent) text-sm font-bold text-white">
        E
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-(--color-text-primary)">
          Elevate<span className="text-(--color-accent)">SDE</span>
        </span>
      )}
    </Link>
  );
}
