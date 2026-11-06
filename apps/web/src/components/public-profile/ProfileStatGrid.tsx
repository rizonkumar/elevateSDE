import { CheckCircle2, Flame, Trophy, Zap } from 'lucide-react';
import type { PublicProfileDto } from '@elevatesde/shared-types';

interface StatTile {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}

function dayLabel(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

export function ProfileStatGrid({ profile }: Readonly<{ profile: PublicProfileDto }>) {
  const tiles: StatTile[] = [
    {
      label: 'Problems solved',
      value: profile.solved.solved.toLocaleString('en-US'),
      hint: `of ${profile.solved.total.toLocaleString('en-US')} available`,
      icon: CheckCircle2,
    },
    {
      label: 'Points',
      value: profile.points.toLocaleString('en-US'),
      hint: 'Earned from practice and contests',
      icon: Zap,
    },
    {
      label: 'Current streak',
      value: dayLabel(profile.streak.current),
      hint: 'Consecutive active days',
      icon: Flame,
    },
    {
      label: 'Longest streak',
      value: dayLabel(profile.streak.longest),
      hint: 'Personal best',
      icon: Trophy,
    },
  ];

  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4 lg:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <li
            key={tile.label}
            className="flex flex-col gap-3 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-4 shadow-(--shadow-card) sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-(--color-text-muted)">{tile.label}</span>
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) text-(--color-accent)">
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <div>
              <div className="font-display text-xl font-semibold tracking-tight text-(--color-metric-text) tabular-nums sm:text-2xl">
                {tile.value}
              </div>
              <div className="mt-1 truncate text-[11px] text-(--color-text-muted)">{tile.hint}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
