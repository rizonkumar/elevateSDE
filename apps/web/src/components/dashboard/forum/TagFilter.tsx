'use client';

import { FORUM_TAGS } from '@/lib/forum-data';

interface TagFilterProps {
  activeTag: string | null;
  onChange: (tag: string | null) => void;
}

function chipClasses(active: boolean): string {
  return `whitespace-nowrap rounded-(--radius-full) border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] ${
    active
      ? 'border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)'
      : 'border-(--color-border-subtle) bg-(--color-surface) text-(--color-text-muted) hover:text-(--color-text-primary)'
  }`;
}

export function TagFilter({ activeTag, onChange }: Readonly<TagFilterProps>) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
      <button type="button" className={chipClasses(activeTag === null)} onClick={() => onChange(null)}>
        All topics
      </button>
      {FORUM_TAGS.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className={chipClasses(activeTag === tag.id)}
          onClick={() => onChange(activeTag === tag.id ? null : tag.id)}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
