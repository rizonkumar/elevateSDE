import { CheckCircle2, CircleDashed } from 'lucide-react';
import type { ProblemProgressStatus } from '@elevatesde/shared-types';

const LABEL: Record<ProblemProgressStatus, string> = {
  SOLVED: 'Solved',
  ATTEMPTED: 'Attempted',
  TODO: 'Not started',
};

export function ProgressMark({ status }: Readonly<{ status: ProblemProgressStatus }>) {
  if (status === 'TODO') {
    return null;
  }
  const Icon = status === 'SOLVED' ? CheckCircle2 : CircleDashed;
  const tone = status === 'SOLVED' ? 'text-(--color-success)' : 'text-(--color-warning)';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
