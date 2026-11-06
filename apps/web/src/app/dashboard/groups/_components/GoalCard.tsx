import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { Badge, type BadgeVariant } from '@elevatesde/ui';
import type { StudyGoalStatus, StudyGroupGoalDto } from '@elevatesde/shared-types';
import { ProgressBar } from '@/components/public-profile/ProgressBar';
import {
  METRIC_META,
  SCOPE_LABEL,
  daysLeftLabel,
  formatMetricValue,
  formatShortDate,
  startsInLabel,
} from '@/lib/study-group-labels';

const STATUS_META: Record<StudyGoalStatus, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'In progress', variant: 'accent' },
  UPCOMING: { label: 'Upcoming', variant: 'neutral' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  ENDED: { label: 'Ended', variant: 'neutral' },
};

interface GoalCardProps {
  goal: StudyGroupGoalDto;
  canManage: boolean;
  onEdit: (goal: StudyGroupGoalDto) => void;
  onDelete: (goal: StudyGroupGoalDto) => void;
}

function timingLabel(goal: StudyGroupGoalDto): string {
  if (goal.status === 'UPCOMING') {
    return startsInLabel(goal.startsAt);
  }
  if (goal.status === 'COMPLETED' && goal.completedAt) {
    return `Completed ${formatShortDate(goal.completedAt)}`;
  }
  return daysLeftLabel(goal.endsAt);
}

function IconButton({
  label,
  onClick,
  children,
}: Readonly<{ label: string; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-(--radius-sm) text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)]"
    >
      {children}
    </button>
  );
}

export function GoalCard({ goal, canManage, onEdit, onDelete }: Readonly<GoalCardProps>) {
  const status = STATUS_META[goal.status];
  const { progress } = goal;
  const done = goal.status === 'COMPLETED';
  const tone = done ? 'bg-(--color-success)' : 'bg-(--color-accent)';

  return (
    <article className="flex flex-col gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 font-display text-base font-semibold tracking-tight">{goal.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant={status.variant}>
              {done && <CheckCircle2 className="h-3 w-3" />}
              {status.label}
            </Badge>
            <Badge variant="neutral">{METRIC_META[goal.metric].label}</Badge>
            <Badge variant="neutral">{SCOPE_LABEL[goal.scope]}</Badge>
          </div>
        </div>
        {canManage && (
          <div className="-mr-1 -mt-1 flex shrink-0 items-center">
            <IconButton label="Edit goal" onClick={() => onEdit(goal)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton label="Delete goal" onClick={() => onDelete(goal)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        )}
      </div>

      {progress.scope === 'GROUP_TOTAL' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-2xl font-semibold tracking-tight text-(--color-text-primary)">
              {progress.current.toLocaleString()}
              <span className="ml-1 text-sm font-medium text-(--color-text-muted)">
                / {formatMetricValue(goal.metric, progress.target)}
              </span>
            </span>
            <span className="text-sm font-medium text-(--color-text-muted)">
              {progress.percent}%
            </span>
          </div>
          <ProgressBar
            value={Math.min(progress.current, progress.target)}
            max={progress.target}
            toneClass={tone}
            label={`${goal.title} progress`}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-2xl font-semibold tracking-tight text-(--color-text-primary)">
              {progress.membersReached}
              <span className="ml-1 text-sm font-medium text-(--color-text-muted)">
                of {progress.memberCount} members reached{' '}
                {formatMetricValue(goal.metric, progress.target)}
              </span>
            </span>
          </div>
          <ProgressBar
            value={progress.membersReached}
            max={Math.max(progress.memberCount, 1)}
            toneClass={tone}
            label={`${goal.title} members reached`}
          />
          {progress.viewerValue !== null && (
            <div className="flex items-center justify-between gap-3 rounded-(--radius-sm) bg-(--color-bg-soft) px-3 py-2 text-sm">
              <span className="text-(--color-text-muted)">Your progress</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-(--color-text-primary)">
                {progress.viewerValue >= progress.target && (
                  <CheckCircle2 className="h-4 w-4 text-(--color-success)" />
                )}
                {progress.viewerValue.toLocaleString()} / {progress.target.toLocaleString()}
              </span>
            </div>
          )}
          {progress.perMember.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {progress.perMember.slice(0, 4).map((member) => (
                <li key={member.userId} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate text-(--color-text-primary) sm:w-32">
                    {member.displayName}
                  </span>
                  <div className="flex-1">
                    <ProgressBar
                      value={Math.min(member.value, progress.target)}
                      max={progress.target}
                      toneClass={member.reached ? 'bg-(--color-success)' : 'bg-(--color-accent)'}
                      label={`${member.displayName} progress`}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs text-(--color-text-muted)">
                    {member.value.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-(--color-border-subtle) pt-3 text-xs text-(--color-text-muted)">
        <span>
          {formatShortDate(goal.startsAt)} – {formatShortDate(goal.endsAt)}
        </span>
        <span className="font-medium">{timingLabel(goal)}</span>
      </div>
    </article>
  );
}
