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

export function AddMembersModal({
  open,
  groupId,
  saving,
  onClose,
  onSubmit,
}: Readonly<AddMembersModalProps>) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<StudyGroupRosterCandidateDto[]>([]);
  const [selected, setSelected] = React.useState<Map<string, StudyGroupRosterCandidateDto>>(
    () => new Map(),
  );
  const [searching, setSearching] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(new Map());
    }
  }, [open]);

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

        {chosen.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chosen.map((candidate) => (
              <button
                key={candidate.userId}
                type="button"
                onClick={() => toggle(candidate)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-accent-soft) py-1 pl-3 pr-2 text-xs font-medium text-(--color-accent)"
                aria-label={`Remove ${candidate.displayName}`}
              >
                {candidate.displayName}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <div className="max-h-80 overflow-y-auto rounded-md border border-(--color-border-subtle)">
          {failed ? (
            <p className="m-0 px-4 py-8 text-center text-sm text-(--color-danger)">
              Search failed. Try again in a moment.
            </p>
          ) : results.length === 0 ? (
            <p className="m-0 px-4 py-8 text-center text-sm text-(--color-text-muted)">
              {searching
                ? 'Searching…'
                : query.trim().length > 0
                  ? 'No one matches that search.'
                  : 'Everyone in your organization is already in this group.'}
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col divide-y divide-(--color-border-subtle) p-0">
              {results.map((candidate) => {
                const isSelected = selected.has(candidate.userId);
                return (
                  <li key={candidate.userId}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggle(candidate)}
                      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-(--color-badge-bg) ${
                        isSelected ? 'bg-(--color-bg-soft)' : ''
                      }`}
                    >
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
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-(--radius-sm) border ${
                          isSelected
                            ? 'border-(--color-accent) bg-(--color-accent) text-white'
                            : 'border-(--color-border) bg-(--color-bg)'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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
            {saving
              ? 'Adding…'
              : chosen.length > 0
                ? `Add ${chosen.length} ${chosen.length === 1 ? 'member' : 'members'}`
                : 'Add members'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
