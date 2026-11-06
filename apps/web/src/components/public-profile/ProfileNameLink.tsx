import Link from 'next/link';

interface ProfileNameLinkProps {
  name: string;
  publicHandle: string | null;
  className?: string;
}

export function publicProfilePath(handle: string): string {
  return `/u/${encodeURIComponent(handle)}`;
}

export function ProfileNameLink({ name, publicHandle, className = '' }: ProfileNameLinkProps) {
  if (!publicHandle) {
    return <span className={className}>{name}</span>;
  }
  return (
    <Link
      href={publicProfilePath(publicHandle)}
      className={`${className} rounded-(--radius-sm) underline-offset-4 hover:text-(--color-accent) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)`.trim()}
      title={`View @${publicHandle}`}
    >
      {name}
    </Link>
  );
}
