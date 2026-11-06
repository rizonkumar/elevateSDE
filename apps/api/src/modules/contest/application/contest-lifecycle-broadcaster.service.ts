import { Injectable } from '@nestjs/common';
import { RealtimePublisher } from '../../realtime/domain/realtime-publisher';
import { IContestRepository } from '../domain/interfaces/contest-repository.interface';
import { deriveContestStatus } from '../domain/contest-status';

export const LIFECYCLE_LOOKBACK_MS = 75_000;

@Injectable()
export class ContestLifecycleBroadcaster {
  constructor(
    private readonly repository: IContestRepository,
    private readonly realtime: RealtimePublisher,
  ) {}

  async broadcastRecent(now: Date = new Date()): Promise<number> {
    const changes = await this.repository.findLifecycleChanges(
      new Date(now.getTime() - LIFECYCLE_LOOKBACK_MS),
      now,
    );
    for (const contest of changes) {
      this.realtime.toContest(contest.id, 'contest:status', {
        contestId: contest.id,
        status: deriveContestStatus(contest.status, contest.startsAt, contest.endsAt, now),
        finalized: contest.finalizedAt !== null,
        rated: contest.ratedAt !== null,
      });
    }
    return changes.length;
  }
}
