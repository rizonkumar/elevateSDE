import Link from 'next/link';
import { Badge, type BadgeVariant } from '@elevatesde/ui';
import { ArrowRight, Clock, ListChecks } from 'lucide-react';
import type { AssessmentDifficulty } from '@elevatesde/shared-types';
import { ASSESSMENT_PROBLEMS } from '@/lib/assessment-problems';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';

const DIFFICULTY_VARIANT: Record<AssessmentDifficulty, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const DIFFICULTY_LABEL: Record<AssessmentDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export default function AssessmentIndexPage() {
  return (
    <PageContainer>
      <PageHeader
        kicker="Code editor"
        title="Coding Assessments"
        description="Solve timed DSA problems in a full IDE with a Monaco editor, run against test cases, and submit your solution."
        className="mb-8"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {ASSESSMENT_PROBLEMS.map((problem) => (
          <Link
            key={problem.id}
            href={`/dashboard/assessment/${problem.id}`}
            className="group flex flex-col rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) transition-colors hover:border-(--color-accent)"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="m-0 font-display text-lg font-semibold tracking-tight text-(--color-text-primary)">
                {problem.title}
              </h2>
              <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
                {DIFFICULTY_LABEL[problem.difficulty]}
              </Badge>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {problem.tags.map((tag) => (
                <Badge key={tag} variant="neutral">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between text-xs text-(--color-text-muted)">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {problem.timeLimitMinutes} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  {problem.testCases.length} tests
                </span>
              </div>
              <span className="inline-flex items-center gap-1 font-semibold text-(--color-accent)">
                Solve
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
