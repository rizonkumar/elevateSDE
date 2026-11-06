'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, ConfirmDialog, Input, Tabs } from '@elevatesde/ui';
import { AdminLayout } from '../../components/AdminLayout';
import { useTaxonomyStore } from '../../store/taxonomy.store';
import type { TaxonomyKind } from '../../lib/taxonomy-api';
import { TermRow } from './_components/TermRow';

const KIND_TABS: { id: TaxonomyKind; label: string }[] = [
  { id: 'topic', label: 'Topics' },
  { id: 'company', label: 'Companies' },
];

const COPY: Record<TaxonomyKind, { description: string; placeholder: string; empty: string }> = {
  topic: {
    description:
      'Topics group problems by pattern, such as Sliding Window or Dynamic Programming. Candidates filter the problem bank by them.',
    placeholder: 'e.g. Sliding Window',
    empty: 'No topics yet.',
  },
  company: {
    description:
      'Companies power the "top questions" lists. Assign them to problems with a frequency from the problem editor.',
    placeholder: 'e.g. Amazon',
    empty: 'No companies yet.',
  },
};

export default function TaxonomyPage() {
  const [kind, setKind] = React.useState<TaxonomyKind>('topic');
  const [name, setName] = React.useState('');
  const [pendingDelete, setPendingDelete] = React.useState<{ id: string; name: string } | null>(
    null,
  );

  const terms = useTaxonomyStore((state) => state.terms[kind]);
  const loaded = useTaxonomyStore((state) => state.loaded[kind]);
  const savingKey = useTaxonomyStore((state) => state.savingKey);
  const load = useTaxonomyStore((state) => state.load);
  const create = useTaxonomyStore((state) => state.create);
  const rename = useTaxonomyStore((state) => state.rename);
  const remove = useTaxonomyStore((state) => state.remove);

  React.useEffect(() => {
    void load(kind, true);
  }, [kind, load]);

  const copy = COPY[kind];

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (await create(kind, name)) {
      setName('');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            items={KIND_TABS}
            value={kind}
            onChange={(id) => {
              setKind(id as TaxonomyKind);
              setName('');
            }}
          />
          <span className="self-start rounded-full border border-(--color-border-subtle) bg-(--color-badge-bg) px-2.5 py-1 text-xs font-semibold text-(--color-text-muted) sm:self-auto">
            {terms.length} {kind === 'topic' ? 'topics' : 'companies'}
          </span>
        </div>

        <p className="m-0 text-sm text-(--color-text-muted)">{copy.description}</p>

        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <Input
            label={kind === 'topic' ? 'New topic' : 'New company'}
            value={name}
            maxLength={60}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.placeholder}
          />
          <Button
            type="submit"
            disabled={!name.trim() || savingKey === `${kind}:new`}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add
          </Button>
        </form>

        {!loaded && (
          <div className="flex min-h-[200px] items-center justify-center">
            <span className="animate-pulse text-sm text-(--color-text-muted)">Loading…</span>
          </div>
        )}

        {loaded && terms.length === 0 && (
          <p className="m-0 rounded-md border border-dashed border-(--color-border-subtle) p-8 text-center text-sm text-(--color-text-muted)">
            {copy.empty}
          </p>
        )}

        {loaded && terms.length > 0 && (
          <ul className="m-0 list-none divide-y divide-(--color-border-subtle) overflow-hidden rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-0 shadow-(--shadow-card)">
            {terms.map((term) => (
              <TermRow
                key={term.id}
                term={term}
                saving={savingKey === `${kind}:${term.id}`}
                onRename={(nextName) => rename(kind, term.id, nextName)}
                onDelete={() => setPendingDelete({ id: term.id, name: term.name })}
              />
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${kind}`}
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed from every problem it is assigned to. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        tone="danger"
        loading={pendingDelete !== null && savingKey === `${kind}:${pendingDelete.id}`}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          void remove(kind, pendingDelete.id).then(() => setPendingDelete(null));
        }}
      />
    </AdminLayout>
  );
}
