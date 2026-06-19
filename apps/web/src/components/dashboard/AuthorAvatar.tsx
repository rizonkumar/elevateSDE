import { getNameInitials } from '@/lib/relative-time';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AuthorAvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export function AuthorAvatar({ name, size = 'md', className = '' }: AuthorAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) font-semibold text-(--color-accent) ${sizeClasses[size]} ${className}`.trim()}
    >
      {getNameInitials(name)}
    </span>
  );
}
