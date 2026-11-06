import { ContestStatus } from '@prisma/client';
import { ContestLifecycleBroadcaster, LIFECYCLE_LOOKBACK_MS } from './contest-lifecycle-broadcaster.service';
import { FakeContestRepository } from '../testing/fake-contest.repository';
import { RecordingRealtimePublisher } from '../../realtime/testing/recording-realtime.publisher';

const NOW = new Date('2026-07-19T18:00:30.000Z');

describe('ContestLifecycleBroadcaster', () => {
  it('pushes the derived status of contests that changed within the lookback window', async () => {
    const repository = new FakeContestRepository();
    const realtime = new RecordingRealtimePublisher();
    repository.lifecycle = [
      {
        id: 'went-live',
        status: ContestStatus.SCHEDULED,
        startsAt: new Date('2026-07-19T18:00:00.000Z'),
        endsAt: new Date('2026-07-19T19:30:00.000Z'),
        finalizedAt: null,
        ratedAt: null,
      },
      {
        id: 'rated',
        status: ContestStatus.SCHEDULED,
        startsAt: new Date('2026-07-19T15:00:00.000Z'),
        endsAt: new Date('2026-07-19T16:00:00.000Z'),
        finalizedAt: new Date('2026-07-19T17:59:50.000Z'),
        ratedAt: new Date('2026-07-19T17:59:51.000Z'),
      },
    ];
    const broadcaster = new ContestLifecycleBroadcaster(repository, realtime);

    await expect(broadcaster.broadcastRecent(NOW)).resolves.toBe(2);

    expect(repository.lifecycleQueries).toEqual([
      { after: new Date(NOW.getTime() - LIFECYCLE_LOOKBACK_MS), upTo: NOW },
    ]);
    expect(realtime.events).toEqual([
      {
        target: 'contest',
        id: 'went-live',
        event: 'contest:status',
        payload: { contestId: 'went-live', status: 'LIVE', finalized: false, rated: false },
      },
      {
        target: 'contest',
        id: 'rated',
        event: 'contest:status',
        payload: { contestId: 'rated', status: 'ENDED', finalized: true, rated: true },
      },
    ]);
  });
});
