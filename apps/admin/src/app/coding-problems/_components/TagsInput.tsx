'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface TagsInputProps {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

export function TagsInput({ label, value, onChange, placeholder }: Readonly<TagsInputProps>) {
  const [draft, setDraft] = React.useState('');

  const commitDraft = () => {
    const candidate = draft.trim();
    if (!candidate) {
      return;
    }
    const exists = value.some((tag) => tag.toLowerCase() === candidate.toLowerCase());
    if (!exists) {
      onChange([...value, candidate]);
    }
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((entry) => entry !== tag));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitDraft();
      return;
    }
    if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label className="text-[13px] font-medium text-(--color-text-primary) select-none">
          {label}
        </label>
      )}
      <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-sm border border-(--color-border) bg-(--color-bg) px-2 py-1.5 transition-all focus-within:border-(--color-accent) focus-within:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) px-2 py-0.5 text-xs font-medium text-(--color-text-primary)"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(tag)}
              className="cursor-pointer text-(--color-text-muted) hover:text-(--color-danger)"
            >
              <X className="h-3 w-3 shrink-0" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-(--color-text-primary) placeholder-(--color-text-disabled) focus:outline-none"
        />
      </div>
    </div>
  );
}
