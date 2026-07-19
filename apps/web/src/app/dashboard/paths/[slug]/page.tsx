'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Badge, Button, type BadgeVariant } from '@elevatesde/ui';
import type { AssessmentDifficulty, PathLevel } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { useLearningPathsStore } from '@/store/learning-paths.store';

const LEVEL_VARIANT: Record<PathLevel, BadgeVariant> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'warning',
  ADVANCED: 'danger',
};

const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const cardClass =
  'rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-card)';

export default function LearningPathDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const active = useLearningPathsStore((state) => state.active);
  const isDetailLoading = useLearningPathsStore((state) => state.isDetailLoading);
  const enrollingId = useLearningPathsStore((state) => state.enrollingId);
  const loadPath = useLearningPathsStore((state) => state.loadPath);
  const enroll = useLearningPathsStore((state) => state.enroll);

  React.useEffect(() => {
    void loadPath(slug);
  }, [slug, loadPath]);

  if (isDetailLoading && !active) {
    return (
      <PageContainer>
        <p className="text-sm text-(--color-text-muted)">Loading learning path…</p>
      </PageContainer>
    );
  }

  if (!active) {
    return (
      <PageContainer>
        <div className="flex flex-col items-start gap-4">
          <Link
            href="/dashboard/paths"
            className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to paths
          </Link>
          <p className="m-0 text-sm text-(--color-text-muted)">
            This learning path is unavailable.
          </p>
        </div>
      </PageContainer>
    );
  }

  const primaryAction = active.enrolled
    ? active.resumeProblemId
      ? {
          label: 'Resume where you left off',
          onClick: () => router.push(`/dashboard/assessment/${active.resumeProblemId}`),
        }
      : null
    : {
        label: enrollingId === active.id ? 'Enrolling…' : 'Enroll',
        onClick: () => void enroll(active.id, slug),
      };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <Link
          href="/dashboard/paths"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to paths
        </Link>

        <div className={cardClass}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={LEVEL_VARIANT[active.level]}>{active.level}</Badge>
              {active.enrolled && <Badge variant="accent">Enrolled</Badge>}
            </div>
            <h1 className="m-0 font-display text-2xl font-semibold tracking-tight">
              {active.title}
            </h1>
            <p className="m-0 max-w-2xl text-sm text-(--color-text-muted)">{active.description}</p>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-(--color-text-muted)">
                <span>
                  {active.progress.solved} of {active.progress.total} solved
                </span>
                <span className="font-semibold tabular-nums">{active.progress.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-(--radius-full) bg-(--color-bg-soft)">
                <div
                  className="h-full rounded-(--radius-full) bg-(--color-accent)"
                  style={{ width: `${active.progress.percent}%` }}
                />
              </div>
            </div>

            {primaryAction && (
              <div>
                <Button onClick={primaryAction.onClick} disabled={enrollingId === active.id}>
                  {primaryAction.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {active.modules.map((module) => (
            <div key={module.id} className={cardClass}>
              <h2 className="m-0 mb-4 font-display text-lg font-semibold tracking-tight">
                {module.title}
              </h2>
              {module.items.length === 0 ? (
                <p className="m-0 text-sm text-(--color-text-muted)">
                  No problems in this module yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {module.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/dashboard/assessment/${item.problemId}`}
                        className="flex items-center gap-3 rounded-lg border border-(--color-border-subtle) bg-(--color-bg) px-4 py-3 transition-colors hover:border-(--color-border)"
                      >
                        {item.solved ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-(--color-accent)" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-(--color-text-muted)" />
                        )}
                        <span className="flex-1 truncate text-sm font-medium text-(--color-text-primary)">
                          {item.title}
                        </span>
                        <Badge variant={DIFFICULTY_VARIANT[item.difficulty]}>
                          {item.difficulty}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
