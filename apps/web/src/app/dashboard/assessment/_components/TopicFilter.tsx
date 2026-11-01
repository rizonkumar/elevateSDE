'use client';

import * as React from 'react';
import { Check, ChevronDown, Tags, X } from 'lucide-react';
import type { TopicDto } from '@elevatesde/shared-types';

interface TopicFilterProps {
  topics: TopicDto[];
  selected: string[];
  onChange: (slugs: string[]) => void;
}

export function TopicFilter({ topics, selected, onChange }: Readonly<TopicFilterProps>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const visible = normalizedQuery
    ? topics.filter((topic) => topic.name.toLowerCase().includes(normalizedQuery))
    : topics;
  const selectedSet = new Set(selected);

  const toggle = (slug: string) => {
    onChange(
      selectedSet.has(slug) ? selected.filter((value) => value !== slug) : [...selected, slug],
    );
  };

  let label = 'Topics';
  if (selected.length === 1) {
    label = topics.find((topic) => topic.slug === selected[0])?.name ?? '1 topic';
  } else if (selected.length > 1) {
    label = `${selected.length} topics`;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors cursor-pointer ${
          selected.length > 0
            ? 'border-(--color-accent) text-(--color-text-primary)'
            : 'border-(--color-border-subtle) text-(--color-text-muted) hover:text-(--color-text-primary)'
        } bg-(--color-surface)`}
      >
        <Tags className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="max-w-[10rem] truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={listId}
          className="absolute left-0 z-30 mt-1.5 w-64 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-2 shadow-(--shadow-card)"
        >
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter topics…"
            aria-label="Filter topics"
            className="mb-2 w-full rounded-sm border border-(--color-border-subtle) bg-(--color-bg-soft) px-2.5 py-1.5 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
          />
          <ul className="m-0 max-h-64 list-none overflow-y-auto p-0">
            {visible.length === 0 && (
              <li className="px-2 py-3 text-center text-xs text-(--color-text-muted)">
                No topics match.
              </li>
            )}
            {visible.map((topic) => {
              const checked = selectedSet.has(topic.slug);
              return (
                <li key={topic.id}>
                  <button
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggle(topic.slug)}
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${
                          checked
                            ? 'border-(--color-accent) bg-(--color-accent) text-(--color-bg)'
                            : 'border-(--color-border-subtle)'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" aria-hidden="true" />}
                      </span>
                      {topic.name}
                    </span>
                    <span className="text-xs text-(--color-text-muted)">{topic.problemCount}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary) cursor-pointer"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Clear topics
            </button>
          )}
        </div>
      )}
    </div>
  );
}
