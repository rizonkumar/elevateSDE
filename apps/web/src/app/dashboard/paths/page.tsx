'use client';

import * as React from 'react';
import Link from 'next/link';
import { Layers, Route } from 'lucide-react';
import { Badge, Select, type BadgeVariant } from '@elevatesde/ui';
import type { LearningPathDto, PathLevel } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useLearningPathsStore } from '@/store/learning-paths.store';

const LEVEL_VARIANT: Record<PathLevel, BadgeVariant> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'warning',
  ADVANCED: 'danger',
};

const LEVEL_LABEL: Record<PathLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

const LEVEL_OPTIONS = [
  { value: '', label: 'All levels' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const cardClass =
  'flex flex-col gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-card) transition-colors hover:border-(--color-border)';

function PathCard({ path }: Readonly<{ path: LearningPathDto }>) {
  return (
    <Link href={`/dashboard/paths/${path.slug}`} className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 font-display text-lg font-semibold tracking-tight">{path.title}</h2>
        <Badge variant={LEVEL_VARIANT[path.level]}>{LEVEL_LABEL[path.level]}</Badge>
      </div>
      <p className="m-0 line-clamp-2 text-sm text-(--color-text-muted)">{path.description}</p>
      {path.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {path.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center gap-2 text-sm text-(--color-text-muted)">
        <Layers className="h-4 w-4" />
        {path.problemCount} problems · {path.moduleCount} modules
      </div>
      {path.enrolled && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-(--color-text-muted)">
            <span>Progress</span>
            <span className="font-semibold tabular-nums">{path.progress.percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-(--radius-full) bg-(--color-bg-soft)">
            <div
              className="h-full rounded-(--radius-full) bg-(--color-accent)"
              style={{ width: `${path.progress.percent}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

export default function LearningPathsPage() {
  const paths = useLearningPathsStore((state) => state.paths);
  const isLoading = useLearningPathsStore((state) => state.isLoading);
  const loadPaths = useLearningPathsStore((state) => state.loadPaths);
  const [level, setLevel] = React.useState('');

  React.useEffect(() => {
    void loadPaths();
  }, [loadPaths]);

  const filtered = level ? paths.filter((path) => path.level === level) : paths;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Prep Tracks"
          title="Learning paths"
          description="Follow curated roadmaps that build up your skills problem by problem."
        />

        <div className="flex justify-end">
          <Select value={level} options={LEVEL_OPTIONS} onChange={setLevel} className="w-48" />
        </div>

        {isLoading && paths.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">Loading learning paths…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
              <Route className="h-5 w-5" />
            </span>
            <h2 className="m-0 font-display text-lg font-semibold">No paths available</h2>
            <p className="m-0 max-w-sm text-sm text-(--color-text-muted)">
              Prep tracks will appear here once they are published.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((path) => (
              <PathCard key={path.id} path={path} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
