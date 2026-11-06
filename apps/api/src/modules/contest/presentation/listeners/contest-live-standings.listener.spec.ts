import { ContestStatus, SubmissionStatus } from '@prisma/client';
import { ContestLiveStandingsListener, LIVE_STANDINGS_WINDOW_MS } from './contest-live-standings.listener';
import { ContestParticipationService } from '../../application/contest-participation.service';
import { ContestStandingsService } from '../../application/contest-standings.service';
import { ContestRatingService } from '../../application/contest-rating.service';
import { buildContestDetail, FakeContestRepository } from '../../testing/fake-contest.repository';
import { RecordingRealtimePublisher } from '../../../realtime/testing/recording-realtime.publisher';
import { TimerScheduler } from '../../../../common/trailing-coalescer';
import { SubmissionJudgedEvent } from '../../../code-runner/domain/events/submission-events';

class ManualScheduler implements TimerScheduler {
  readonly delays: number[] = [];
  private callbacks: Array<() => void> = [];

  schedule(callback: () => void, delayMs: number): () => void {
    this.delays.push(delayMs);
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((entry) => entry !== callback);
    };
  }

  flush(): void {
    const pending = this.callbacks;
    this.callbacks = [];
    for (const callback of pending) {
      callback();
    }
  }
}

function judged(overrides: Partial<SubmissionJudgedEvent> = {}): SubmissionJudgedEvent {
  return {
    submissionId: 's1',
    userId: 'u1',
    problemId: 'p1',
    status: SubmissionStatus.WRONG_ANSWER,
    judgedAt: new Date(),
    ...overrides,
  };
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('ContestLiveStandingsListener', () => {
  let repository: FakeContestRepository;
  let realtime: RecordingRealtimePublisher;
  let scheduler: ManualScheduler;
  let listener: ContestLiveStandingsListener;

  beforeEach(() => {
    const now = Date.now();
    repository = new FakeContestRepository();
    repository.detail = buildContestDetail({
      status: ContestStatus.SCHEDULED,
      startsAt: new Date(now - 3_600_000),
      endsAt: new Date(now + 3_600_000),
    });
    repository.participants = [
      { userId: 'u1', firstName: 'Ada', lastName: 'Lovelace', publicHandle: 'ada' },
      { userId: 'u2', firstName: 'Alan', lastName: 'Turing', publicHandle: null },
    ];
    repository.liveEntries = [{ contestId: 'contest-1', userId: 'u1', problemId: 'p1' }];
    realtime = new RecordingRealtimePublisher();
    scheduler = new ManualScheduler();
    const ratingService = {
      getStandingRatings: jest.fn().mockResolvedValue(new Map()),
    } as unknown as ContestRatingService;
    const participation = new ContestParticipationService(
      repository,
      new ContestStandingsService(repository),
      ratingService,
    );
    listener = new ContestLiveStandingsListener(participation, realtime, scheduler);
  });

  it('coalesces a burst of judged submissions into one standings push', async () => {
    await listener.onSubmissionJudged(judged({ submissionId: 's1' }));
    await listener.onSubmissionJudged(judged({ submissionId: 's2' }));
    await listener.onSubmissionJudged(judged({ submissionId: 's3' }));

    expect(scheduler.delays).toEqual([LIVE_STANDINGS_WINDOW_MS]);
    expect(realtime.events).toHaveLength(0);

    scheduler.flush();
    await settle();

    const pushes = realtime.eventsNamed('contest:standings');
    expect(pushes).toHaveLength(1);
    expect(pushes[0]?.id).toBe('contest-1');
    expect(pushes[0]?.payload).toEqual({
      contestId: 'contest-1',
      generatedAt: expect.any(String),
      rows: expect.arrayContaining([
        expect.objectContaining({ userId: 'u1', publicHandle: 'ada', isCurrentUser: false }),
        expect.objectContaining({ userId: 'u2', isCurrentUser: false }),
      ]),
    });
  });

  it('ignores submissions outside live contests the user is registered in', async () => {
    await listener.onSubmissionJudged(judged({ userId: 'u3' }));
    await listener.onSubmissionJudged(judged({ problemId: 'other-problem' }));

    expect(scheduler.delays).toHaveLength(0);
    scheduler.flush();
    await settle();
    expect(realtime.events).toHaveLength(0);
  });
});
