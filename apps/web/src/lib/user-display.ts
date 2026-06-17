import type { UserDto } from '@elevatesde/shared-types';

function titleCase(value: string): string {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDisplayName(user: UserDto | null): string {
  if (!user) return 'Account';
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  const local = user.email.split('@')[0] ?? user.email;
  return titleCase(local) || user.email;
}

export function getInitial(user: UserDto | null): string {
  return getDisplayName(user).charAt(0).toUpperCase() || 'U';
}
