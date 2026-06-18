import Link from 'next/link';
import { Badge, type BadgeVariant } from '@elevatesde/ui';
import { ArrowRight, Clock, ListChecks } from 'lucide-react';
import type { AssessmentDifficulty } from '@elevatesde/shared-types';
import { ASSESSMENT_PROBLEMS } from '@/lib/assessment-problems';

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
    <div className="mx-auto w-full max-w-300 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-8">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent)">
          Code editor
        </div>
        <h1 className="m-0 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Coding Assessments
        </h1>
        <p className="mt-1.5 mb-0 max-w-xl text-sm text-(--color-text-muted)">
          Solve timed DSA problems in a full IDE with a Monaco editor, run against test cases, and
          submit your solution.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {ASSESSMENT_PROBLEMS.map((problem) => (
          <Link
            key={problem.id}
            href={`/dashboard/assessment/${problem.id}`}
            className="group flex flex-col rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-soft) transition-colors hover:border-(--color-accent)"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="m-0 font-display text-lg font-bold tracking-tight text-(--color-text-primary)">
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
    </div>
  );
}
