'use client';

import { Clock } from 'lucide-react';
import type { ContestStatus } from '@elevatesde/shared-types';
import { useNow } from '@/hooks/use-now';
import { formatContestDate, formatCountdown } from '@/lib/contest-time';

interface ContestCountdownProps {
  status: ContestStatus;
  startsAt: string;
  endsAt: string;
}

export function ContestCountdown({ status, startsAt, endsAt }: Readonly<ContestCountdownProps>) {
  const now = useNow(1000);

  if (status === 'LIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-success)">
        <Clock className="h-4 w-4" />
        Ends in {formatCountdown(endsAt, now)}
      </span>
    );
  }
  if (status === 'SCHEDULED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-text-primary)">
        <Clock className="h-4 w-4" />
        Starts in {formatCountdown(startsAt, now)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted)">
      <Clock className="h-4 w-4" />
      Ended {formatContestDate(endsAt)}
    </span>
  );
}
