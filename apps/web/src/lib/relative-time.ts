const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < MINUTE) {
    return 'just now';
  }
  if (seconds < HOUR) {
    const minutes = Math.floor(seconds / MINUTE);
    return `${minutes}m ago`;
  }
  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    return `${hours}h ago`;
  }
  if (seconds < WEEK) {
    const days = Math.floor(seconds / DAY);
    return `${days}d ago`;
  }
  const weeks = Math.floor(seconds / WEEK);
  if (weeks < 5) {
    return `${weeks}w ago`;
  }
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  const initials = `${first}${last}`.toUpperCase();
  return initials || 'U';
}
