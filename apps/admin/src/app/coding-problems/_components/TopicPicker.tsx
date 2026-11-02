'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { TopicDto } from '@elevatesde/shared-types';

const MAX_TOPICS = 10;

interface TopicPickerProps {
  topics: TopicDto[];
  value: string[];
  onChange: (topicIds: string[]) => void;
}

export function TopicPicker({ topics, value, onChange }: Readonly<TopicPickerProps>) {
  const [query, setQuery] = React.useState('');
  const selected = new Set(value);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = normalizedQuery
    ? topics.filter((topic) => topic.name.toLowerCase().includes(normalizedQuery))
    : topics;
  const atLimit = value.length >= MAX_TOPICS;

  const toggle = (id: string) => {
    if (selected.has(id)) {
      onChange(value.filter((topicId) => topicId !== id));
    } else if (!atLimit) {
      onChange([...value, id]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
          Topics
        </span>
        <span className="text-xs text-(--color-text-muted)">
          {value.length}/{MAX_TOPICS} selected
        </span>
      </div>
      {topics.length === 0 ? (
        <p className="m-0 rounded-(--radius-sm) border border-dashed border-(--color-border-subtle) p-3 text-xs text-(--color-text-muted)">
          No topics exist yet.{' '}
          <Link href="/taxonomy" className="font-semibold text-(--color-accent)">
            Create topics
          </Link>{' '}
          first.
        </p>
      ) : (
        <>
          {topics.length > 12 && (
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter topics…"
              aria-label="Filter topics"
              className="h-9 rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) px-3 text-sm text-(--color-text-primary) outline-none focus:border-(--color-accent)"
            />
          )}
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {visible.map((topic) => {
              const isSelected = selected.has(topic.id);
              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={!isSelected && atLimit}
                  onClick={() => toggle(topic.id)}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? 'border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)'
                      : 'border-(--color-border-subtle) text-(--color-text-muted) hover:text-(--color-text-primary)'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  {topic.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
