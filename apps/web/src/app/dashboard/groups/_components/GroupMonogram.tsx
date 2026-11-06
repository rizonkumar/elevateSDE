import { getNameInitials } from '@/lib/relative-time';

type MonogramSize = 'md' | 'lg';

const SIZE_CLASS: Record<MonogramSize, string> = {
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

interface GroupMonogramProps {
  name: string;
  size?: MonogramSize;
}

export function GroupMonogram({ name, size = 'md' }: Readonly<GroupMonogramProps>) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-accent-soft) font-display font-semibold text-(--color-accent) ${SIZE_CLASS[size]}`}
    >
      {getNameInitials(name)}
    </span>
  );
}
