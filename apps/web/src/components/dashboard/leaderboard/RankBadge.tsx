interface RankBadgeProps {
  rank: number;
}

const medalClasses: Record<number, string> = {
  1: 'bg-(--color-warning-soft) text-(--color-warning)',
  2: 'bg-(--color-badge-bg) text-(--color-text-primary)',
  3: 'bg-(--color-accent-soft) text-(--color-accent)',
};

export function RankBadge({ rank }: Readonly<RankBadgeProps>) {
  const medal = medalClasses[rank];
  if (medal) {
    return (
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${medal}`}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center text-sm font-semibold text-(--color-text-muted)">
      {rank}
    </span>
  );
}
