'use client';

import * as React from 'react';
import { Check, Search, X } from 'lucide-react';
import { Button, Input, Modal } from '@elevatesde/ui';
import type { StudyGroupRosterCandidateDto } from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { searchRosterCandidates } from '@/lib/study-groups-api';

interface AddMembersModalProps {
  open: boolean;
  groupId: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (userIds: string[]) => Promise<boolean>;
}

const SEARCH_DELAY_MS = 250;

function useRosterSearch(open: boolean, groupId: string, query: string) {
  const [results, setResults] = React.useState<StudyGroupRosterCandidateDto[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchRosterCandidates(groupId, query.trim())
        .then((candidates) => {
          if (!cancelled) {
            setResults(candidates);
            setFailed(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFailed(true);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, groupId, query]);

  return { results, searching, failed };
}

function useCandidateSelection(open: boolean) {
  const [selected, setSelected] = React.useState<Map<string, StudyGroupRosterCandidateDto>>(
    () => new Map(),
  );

  React.useEffect(() => {
    if (open) {
      setSelected(new Map());
    }
  }, [open]);

  const toggle = (candidate: StudyGroupRosterCandidateDto) => {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(candidate.userId)) {
        next.delete(candidate.userId);
      } else {
        next.set(candidate.userId, candidate);
      }
      return next;
    });
  };

  return { selected, toggle };
}

function emptyResultsMessage(searching: boolean, query: string): string {
  if (searching) {
    return 'Searching…';
  }
  if (query.trim().length > 0) {
    return 'No one matches that search.';
  }
  return 'Everyone in your organization is already in this group.';
}

function submitLabel(saving: boolean, count: number): string {
  if (saving) {
    return 'Adding…';
  }
  if (count === 0) {
    return 'Add members';
  }
  return `Add ${count} ${count === 1 ? 'member' : 'members'}`;
}

function checkboxToneClass(isSelected: boolean): string {
  return isSelected
    ? 'border-(--color-accent) bg-(--color-accent) text-white'
    : 'border-(--color-border) bg-(--color-bg)';
}

interface CandidateRowProps {
  candidate: StudyGroupRosterCandidateDto;
  isSelected: boolean;
  onToggle: (candidate: StudyGroupRosterCandidateDto) => void;
}

function CandidateRow({ candidate, isSelected, onToggle }: Readonly<CandidateRowProps>) {
  return (
    <li>
      <label
        className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-(--color-badge-bg) focus-within:bg-(--color-badge-bg) ${
          isSelected ? 'bg-(--color-bg-soft)' : ''
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={isSelected}
          onChange={() => onToggle(candidate)}
        />
        <AuthorAvatar name={candidate.displayName} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-(--color-text-primary)">
            {candidate.displayName}
          </span>
          <span className="block truncate text-xs text-(--color-text-muted)">
            {candidate.email}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-(--radius-sm) border ${checkboxToneClass(isSelected)}`}
        >
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </span>
      </label>
    </li>
  );
}

interface CandidateListProps {
  results: StudyGroupRosterCandidateDto[];
  selected: Map<string, StudyGroupRosterCandidateDto>;
  searching: boolean;
  failed: boolean;
  query: string;
  onToggle: (candidate: StudyGroupRosterCandidateDto) => void;
}

function CandidateList({
  results,
  selected,
  searching,
  failed,
  query,
  onToggle,
}: Readonly<CandidateListProps>) {
  if (failed) {
    return (
      <p className="m-0 px-4 py-8 text-center text-sm text-(--color-danger)">
        Search failed. Try again in a moment.
      </p>
    );
  }
  if (results.length === 0) {
    return (
      <p className="m-0 px-4 py-8 text-center text-sm text-(--color-text-muted)">
        {emptyResultsMessage(searching, query)}
      </p>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-(--color-border-subtle) p-0">
      {results.map((candidate) => (
        <CandidateRow
          key={candidate.userId}
          candidate={candidate}
          isSelected={selected.has(candidate.userId)}
          onToggle={onToggle}
        />
      ))}
    </ul>
  );
}

function SelectedChips({
  chosen,
  onToggle,
}: Readonly<{
  chosen: StudyGroupRosterCandidateDto[];
  onToggle: (candidate: StudyGroupRosterCandidateDto) => void;
}>) {
  if (chosen.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {chosen.map((candidate) => (
        <button
          key={candidate.userId}
          type="button"
          onClick={() => onToggle(candidate)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-accent-soft) py-1 pl-3 pr-2 text-xs font-medium text-(--color-accent)"
          aria-label={`Remove ${candidate.displayName}`}
        >
          {candidate.displayName}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}

export function AddMembersModal({
  open,
  groupId,
  saving,
  onClose,
  onSubmit,
}: Readonly<AddMembersModalProps>) {
  const [query, setQuery] = React.useState('');
  const { results, searching, failed } = useRosterSearch(open, groupId, query);
  const { selected, toggle } = useCandidateSelection(open);

  React.useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  const handleSubmit = async () => {
    const added = await onSubmit([...selected.keys()]);
    if (added) {
      onClose();
    }
  };

  const chosen = [...selected.values()];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add members"
      description="Search people in your organization who are not in this group yet."
    >
      <div className="flex flex-col gap-4">
        <Input
          aria-label="Search people"
          placeholder="Search by name or email"
          value={query}
          autoFocus
          icon={<Search className="h-4 w-4" />}
          onChange={(event) => setQuery(event.target.value)}
        />

        <SelectedChips chosen={chosen} onToggle={toggle} />

        <div className="max-h-80 overflow-y-auto rounded-md border border-(--color-border-subtle)">
          <CandidateList
            results={results}
            selected={selected}
            searching={searching}
            failed={failed}
            query={query}
            onToggle={toggle}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-(--color-border-subtle) pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || chosen.length === 0}
            onClick={() => void handleSubmit()}
          >
            {submitLabel(saving, chosen.length)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
