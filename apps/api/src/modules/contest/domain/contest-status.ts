import { ContestStatus } from '@prisma/client';

const FINALIZATION_GRACE_MS = 2 * 60_000;

export function finalizationCutoff(now: Date): Date {
  return new Date(now.getTime() - FINALIZATION_GRACE_MS);
}

export function deriveContestStatus(
  storedStatus: ContestStatus,
  startsAt: Date,
  endsAt: Date,
  now: Date,
): ContestStatus {
  if (storedStatus === ContestStatus.DRAFT) {
    return ContestStatus.DRAFT;
  }
  if (now >= endsAt) {
    return ContestStatus.ENDED;
  }
  if (now >= startsAt) {
    return ContestStatus.LIVE;
  }
  return ContestStatus.SCHEDULED;
}
