import type { AssessmentDifficulty, PublicProfileRecentSolveDto } from '@elevatesde/shared-types';
import { Badge } from '@elevatesde/ui';
import type { BadgeVariant } from '@elevatesde/ui';
import { EmptyNote, SectionCard } from './SectionCard';

const DIFFICULTY_BADGE: Record<AssessmentDifficulty, { label: string; variant: BadgeVariant }> = {
  EASY: { label: 'Easy', variant: 'success' },
  MEDIUM: { label: 'Medium', variant: 'warning' },
  HARD: { label: 'Hard', variant: 'danger' },
};

function solvedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function RecentSolvesCard({
  solves,
  className,
}: Readonly<{
  solves: PublicProfileRecentSolveDto[];
  className?: string;
}>) {
  return (
    <SectionCard className={className} title="Recent solves">
      {solves.length === 0 ? (
        <EmptyNote>No accepted solutions yet.</EmptyNote>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {solves.map((solve) => {
            const difficulty = DIFFICULTY_BADGE[solve.difficulty];
            return (
              <li
                key={solve.slug}
                className="flex items-center justify-between gap-3 border-b border-(--color-border-subtle) py-2.5 first:pt-0 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-(--color-text-primary)">
                    {solve.title}
                  </div>
                  <div className="text-xs text-(--color-text-muted)">
                    {solvedLabel(solve.solvedAt)}
                  </div>
                </div>
                <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
