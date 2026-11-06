import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PointSource, StudyGroupRole } from '@prisma/client';
import { RecordingRealtimePublisher } from '../../../realtime/testing/recording-realtime.publisher';
import { StudyGroupActivityService } from '../../application/study-group-activity.service';
import { FakeStudyGroupRepository } from '../../testing/fake-study-group.repository';
import { StudyGroupActivityListener } from './study-group-activity.listener';

describe('StudyGroupActivityListener', () => {
  it('publishes the feed item to every active group of the earner', async () => {
    const repository = new FakeStudyGroupRepository();
    repository.addUser({ id: 'a', firstName: 'Ada', lastName: 'L', email: 'a@x.io', tenantId: 't' });
    const first = repository.seedGroup({ tenantId: 't', name: 'One' }).id;
    const archived = repository.seedGroup({ tenantId: 't', name: 'Old', archivedAt: new Date() }).id;
    repository.seedMember(first, 'a', StudyGroupRole.OWNER);
    repository.seedMember(archived, 'a');
    const publisher = new RecordingRealtimePublisher();
    const listener = new StudyGroupActivityListener(
      new StudyGroupActivityService(repository, new EventEmitter2()),
      publisher,
    );
    const awardedAt = new Date('2027-03-10T12:00:00.000Z');

    await listener.onPointsAwarded({
      userId: 'a',
      source: PointSource.PROBLEM_SOLVED,
      refId: 'p1',
      delta: 20,
      awardedAt,
    });

    expect(publisher.eventsNamed('group:activity')).toEqual([
      {
        target: 'group',
        id: first,
        event: 'group:activity',
        payload: {
          groupId: first,
          item: expect.objectContaining({
            id: 'a:PROBLEM_SOLVED:p1',
            displayName: 'Ada L',
            points: 20,
            occurredAt: awardedAt.toISOString(),
          }),
        },
      },
    ]);
  });

  it('swallows failures so point awards are never affected', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const publisher = new RecordingRealtimePublisher();
    const failing = {
      recordAward: () => Promise.reject(new Error('db down')),
    } as unknown as StudyGroupActivityService;
    const listener = new StudyGroupActivityListener(failing, publisher);

    await expect(
      listener.onPointsAwarded({
        userId: 'a',
        source: PointSource.PROBLEM_SOLVED,
        refId: 'p1',
        delta: 20,
        awardedAt: new Date(),
      }),
    ).resolves.toBeUndefined();
    expect(publisher.events).toHaveLength(0);
  });
});
