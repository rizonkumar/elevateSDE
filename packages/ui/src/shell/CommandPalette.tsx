'use client';

import * as React from 'react';
import type { ShellIcon } from './types';
import { EnterIcon, SearchIcon } from './icons';
import {
  closeCommandPalette,
  useCommandPalette,
  useCommandPaletteHotkey,
} from './command-palette-store';

export interface CommandItem {
  id: string;
  label: string;
  icon: ShellIcon;
  keywords?: string[];
  hint?: string;
  onSelect: () => void;
}

export interface CommandSection {
  id: string;
  label: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  sections: CommandSection[];
}

interface IndexedCommand {
  item: CommandItem;
  section: CommandSection;
  index: number;
}

function matches(item: CommandItem, section: CommandSection, terms: string[]): boolean {
  const haystack = [item.label, section.label, ...(item.keywords ?? [])].join(' ').toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function CommandPalette({ sections }: CommandPaletteProps) {
  useCommandPaletteHotkey();
  const { open } = useCommandPalette();
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();
  const optionIdPrefix = React.useId();

  const filtered = React.useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const grouped: { section: CommandSection; commands: IndexedCommand[] }[] = [];
    let index = 0;
    for (const section of sections) {
      const commands: IndexedCommand[] = [];
      for (const item of section.items) {
        if (terms.length > 0 && !matches(item, section, terms)) continue;
        commands.push({ item, section, index });
        index += 1;
      }
      if (commands.length > 0) grouped.push({ section, commands });
    }
    return { grouped, flat: grouped.flatMap((group) => group.commands) };
  }, [sections, query]);

  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  React.useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const run = (command: IndexedCommand | undefined) => {
    if (!command) return;
    closeCommandPalette();
    command.item.onSelect();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const total = filtered.flat.length;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCommandPalette();
    } else if (event.key === 'ArrowDown' && total > 0) {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % total);
    } else if (event.key === 'ArrowUp' && total > 0) {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + total) % total);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(filtered.flat[activeIndex]);
    }
  };

  const optionId = (index: number) => `${optionIdPrefix}-${index}`;
  const hasResults = filtered.flat.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div
        aria-hidden="true"
        onClick={closeCommandPalette}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-modal)"
      >
        <div className="flex items-center gap-3 border-b border-(--color-border-subtle) px-4">
          <SearchIcon className="h-4 w-4 shrink-0 text-(--color-text-disabled)" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={hasResults}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={hasResults ? optionId(activeIndex) : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions…"
            autoComplete="off"
            spellCheck={false}
            className="h-12 flex-1 bg-transparent text-sm text-(--color-text-primary) placeholder:text-(--color-text-disabled) focus:outline-none"
          />
          <kbd className="hidden rounded-[4px] border border-(--color-border-subtle) px-1.5 py-0.5 font-sans text-[11px] font-medium text-(--color-text-muted) sm:block">
            Esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Results"
          className="max-h-[min(60vh,420px)] overflow-y-auto p-2"
        >
          {hasResults ? (
            filtered.grouped.map(({ section, commands }) => (
              <div
                key={section.id}
                role="group"
                aria-label={section.label}
                className="pb-1 last:pb-0"
              >
                <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-(--color-text-disabled)">
                  {section.label}
                </div>
                {commands.map((command) => {
                  const Icon = command.item.icon;
                  const active = command.index === activeIndex;
                  return (
                    <div
                      key={command.item.id}
                      id={optionId(command.index)}
                      role="option"
                      aria-selected={active}
                      data-index={command.index}
                      onMouseMove={() => setActiveIndex(command.index)}
                      onClick={() => run(command)}
                      className={`flex h-10 cursor-pointer items-center gap-3 rounded-(--radius-sm) px-2.5 text-sm ${
                        active
                          ? 'bg-(--color-badge-bg) text-(--color-text-primary)'
                          : 'text-(--color-text-muted)'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-(--color-accent)' : 'text-(--color-text-disabled)'
                        }`}
                      />
                      <span className="flex-1 truncate font-medium">{command.item.label}</span>
                      {command.item.hint && (
                        <span className="shrink-0 text-xs text-(--color-text-disabled)">
                          {command.item.hint}
                        </span>
                      )}
                      {active && (
                        <EnterIcon className="h-3.5 w-3.5 shrink-0 text-(--color-text-disabled)" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <p className="m-0 px-3 py-10 text-center text-sm text-(--color-text-muted)">
              No results for “{query.trim()}”
            </p>
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-(--color-border-subtle) px-4 py-2 text-[11px] text-(--color-text-disabled) sm:flex">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-[4px] border border-(--color-border-subtle) px-1 font-sans">
              ↑
            </kbd>
            <kbd className="rounded-[4px] border border-(--color-border-subtle) px-1 font-sans">
              ↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-[4px] border border-(--color-border-subtle) px-1 font-sans">
              ↵
            </kbd>
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-[4px] border border-(--color-border-subtle) px-1 font-sans">
              Esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
