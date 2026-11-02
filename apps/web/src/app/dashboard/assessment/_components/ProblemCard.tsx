import Link from 'next/link';
import { ArrowRight, Building2, Clock } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { ProblemListItemDto } from '@elevatesde/shared-types';
import { DIFFICULTY_LABEL, DIFFICULTY_VARIANT } from '@/lib/difficulty';
import { ProgressMark } from './ProgressMark';

const MAX_TOPICS = 4;
const MAX_COMPANIES = 2;

export function ProblemCard({ problem }: Readonly<{ problem: ProblemListItemDto }>) {
  const companies = problem.companies.slice(0, MAX_COMPANIES);
  const extraCompanies = problem.companies.length - companies.length;

  return (
    <Link
      href={`/dashboard/assessment/${problem.id}`}
      className="group flex flex-col rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) transition-colors hover:border-(--color-accent)"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="m-0 font-display text-lg font-semibold tracking-tight text-(--color-text-primary)">
          {problem.title}
        </h2>
        <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
          {DIFFICULTY_LABEL[problem.difficulty]}
        </Badge>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {problem.topics.slice(0, MAX_TOPICS).map((topic) => (
          <Badge key={topic.id} variant="neutral">
            {topic.name}
          </Badge>
        ))}
      </div>

      {companies.length > 0 && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-(--color-text-muted)">
          <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {companies.map((company) => company.name).join(', ')}
            {extraCompanies > 0 && ` +${extraCompanies}`}
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-(--color-text-muted)">
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {problem.timeLimitMinutes} min
          </span>
          <ProgressMark status={problem.status} />
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-(--color-accent)">
          Solve
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
