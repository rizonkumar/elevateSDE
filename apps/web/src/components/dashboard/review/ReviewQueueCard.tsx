'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, RotateCcw } from 'lucide-react';
import { Badge, Button } from '@elevatesde/ui';
import type { ReviewItemDto, ReviewQuality } from '@elevatesde/shared-types';
import { DIFFICULTY_LABEL, DIFFICULTY_VARIANT } from '@/lib/difficulty';

type ButtonVariant = React.ComponentProps<typeof Button>['variant'];

interface RatingOption {
  label: string;
  quality: ReviewQuality;
  variant: ButtonVariant;
}

const RATING_OPTIONS: RatingOption[] = [
  { label: 'Again', quality: 2, variant: 'danger' },
  { label: 'Hard', quality: 3, variant: 'secondary' },
  { label: 'Good', quality: 4, variant: 'secondary' },
  { label: 'Easy', quality: 5, variant: 'primary' },
];

interface ReviewQueueCardProps {
  item: ReviewItemDto;
  isGrading: boolean;
  onGrade: (quality: ReviewQuality) => void;
}

function formatReviewMeta(item: ReviewItemDto): string {
  if (item.repetitions === 0) {
    return 'First review';
  }
  const repetitionLabel = item.repetitions === 1 ? 'repetition' : 'repetitions';
  return `${item.repetitions} ${repetitionLabel} · every ${item.intervalDays}d`;
}

export function ReviewQueueCard({ item, isGrading, onGrade }: Readonly<ReviewQueueCardProps>) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-card)">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={DIFFICULTY_VARIANT[item.problem.difficulty]}>
          {DIFFICULTY_LABEL[item.problem.difficulty]}
        </Badge>
        <Badge>
          <RotateCcw className="h-3 w-3" />
          {formatReviewMeta(item)}
        </Badge>
      </div>
      <h2 className="m-0 font-display text-lg font-semibold tracking-tight">
        {item.problem.title}
      </h2>
      {item.problem.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.problem.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
        <Clock className="h-4 w-4" />
        {item.problem.timeLimitMinutes} min
      </div>
      <div className="mt-auto flex flex-col gap-3 border-t border-(--color-border-subtle) pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
            How well did you recall it?
          </span>
          <Link
            href={`/dashboard/assessment/${item.problem.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-(--color-accent) hover:opacity-80"
          >
            Solve <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {RATING_OPTIONS.map((option) => (
            <Button
              key={option.quality}
              variant={option.variant}
              disabled={isGrading}
              onClick={() => onGrade(option.quality)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
