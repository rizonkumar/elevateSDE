import Link from 'next/link';
import { Lock, Target, Users } from 'lucide-react';
import { Badge, Button } from '@elevatesde/ui';
import type { StudyGroupSummaryDto } from '@elevatesde/shared-types';
import { GroupMonogram } from './GroupMonogram';

interface GroupCardProps {
  group: StudyGroupSummaryDto;
  onJoin?: (group: StudyGroupSummaryDto) => void;
  joining?: boolean;
}

const cardClass =
  'group relative flex h-full flex-col gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) transition-colors hover:border-(--color-border) sm:p-6';

function rankLabel(rank: number | null): string {
  return rank === null ? 'No points yet' : `#${rank} this week`;
}

export function GroupCard({ group, onJoin, joining = false }: Readonly<GroupCardProps>) {
  const isMine = group.myRole !== null;
  return (
    <article className={cardClass}>
      <div className="flex items-start gap-3">
        <GroupMonogram name={group.name} />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate font-display text-base font-semibold tracking-tight">
            <Link
              href={`/dashboard/groups/${group.id}`}
              className="rounded-(--radius-sm) text-(--color-text-primary) transition-colors group-hover:text-(--color-accent) after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
            >
              {group.name}
            </Link>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {group.myRole === 'OWNER' && <Badge variant="accent">Owner</Badge>}
            {group.joinPolicy === 'INVITE_ONLY' ? (
              <Badge variant="neutral">
                <Lock className="h-3 w-3" />
                Invite only
              </Badge>
            ) : (
              <Badge variant="success">Open</Badge>
            )}
          </div>
        </div>
      </div>

      <p className="m-0 line-clamp-2 min-h-10 text-sm text-(--color-text-muted)">
        {group.description ?? 'No description yet.'}
      </p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border-subtle) pt-4 text-sm text-(--color-text-muted)">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            {group.activeGoalCount} active {group.activeGoalCount === 1 ? 'goal' : 'goals'}
          </span>
        </div>
        {isMine ? (
          <span
            className={`rounded-(--radius-full) px-2.5 py-0.5 text-xs font-semibold ${
              group.myWeeklyRank === null
                ? 'bg-(--color-badge-bg) text-(--color-text-muted)'
                : 'bg-(--color-accent-soft) text-(--color-accent)'
            }`}
          >
            {rankLabel(group.myWeeklyRank)}
          </span>
        ) : (
          onJoin &&
          group.joinPolicy === 'OPEN' && (
            <Button
              type="button"
              variant="secondary"
              className="relative z-10 h-8 px-3"
              disabled={joining}
              onClick={() => onJoin(group)}
            >
              {joining ? 'Joining…' : 'Join'}
            </Button>
          )
        )}
      </div>
    </article>
  );
}
