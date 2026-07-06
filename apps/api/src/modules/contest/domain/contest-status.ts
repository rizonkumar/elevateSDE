import { ContestStatus } from '@prisma/client';

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
