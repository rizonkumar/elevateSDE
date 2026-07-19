const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export function formatCountdown(targetIso: string, now: number): string {
  const remaining = new Date(targetIso).getTime() - now;
  if (remaining <= 0) {
    return '0s';
  }
  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const seconds = Math.floor((remaining % MINUTE) / SECOND);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatContestDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatContestDuration(startsAtIso: string, endsAtIso: string): string {
  const ms = new Date(endsAtIso).getTime() - new Date(startsAtIso).getTime();
  const hours = Math.floor(ms / HOUR);
  const minutes = Math.round((ms % HOUR) / MINUTE);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatPenalty(penaltySeconds: number): string {
  const hours = Math.floor(penaltySeconds / 3600);
  const minutes = Math.floor((penaltySeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
