import { EventEmitter2 } from '@nestjs/event-emitter';
import { PointSource, StudyGoalMetric, StudyGoalScope, StudyGroupRole } from '@prisma/client';
import {
  NOTIFICATION_EVENTS,
  StudyGoalCompletedEvent,
} from '../../notification/domain/events/notification-events';
import { FakeStudyGroupRepository } from '../testing/fake-study-group.repository';
import { StudyGroupActivityService } from './study-group-activity.service';

const TENANT = 'tenant-1';
const NOW = new Date('2027-03-10T12:00:00.000Z');

describe('StudyGroupActivityService', () => {
  let repository: FakeStudyGroupRepository;
  let service: StudyGroupActivityService;
  let completed: StudyGoalCompletedEvent[];
  let groupId: string;

  const award = (userId: string, refId: string, source: PointSource = PointSource.PROBLEM_SOLVED) => {
    repository.seedLedger({ userId, source, refId, createdAt: NOW });
    return service.recordAward(
      { userId, source, refId, delta: 10, awardedAt: NOW },
      NOW,
    );
  };

  beforeEach(() => {
    repository = new FakeStudyGroupRepository();
    const emitter = new EventEmitter2();
    completed = [];
    emitter.on(NOTIFICATION_EVENTS.STUDY_GOAL_COMPLETED, (event: StudyGoalCompletedEvent) =>
      completed.push(event),
    );
    service = new StudyGroupActivityService(repository, emitter);
    ['a', 'b'].forEach((id) =>
      repository.addUser({ id, firstName: id.toUpperCase(), lastName: 'T', email: `${id}@x.io`, tenantId: TENANT }),
    );
    groupId = repository.seedGroup({ tenantId: TENANT, name: 'Cohort' }).id;
    repository.seedMember(groupId, 'a', StudyGroupRole.OWNER);
    repository.seedMember(groupId, 'b');
  });

  it('returns the groups and a feed item for the earner', async () => {
    const second = repository.seedGroup({ tenantId: TENANT, name: 'Second' }).id;
    repository.seedMember(second, 'a');

    const recorded = await award('a', 'p1');

    expect(recorded.groupIds.sort()).toEqual([groupId, second].sort());
    expect(recorded.activity).toMatchObject({
      id: 'a:PROBLEM_SOLVED:p1',
      userId: 'a',
      kind: 'PROBLEM_SOLVED',
      points: 10,
    });
  });

  it('records nothing for users outside any group or for admin adjustments', async () => {
    repository.addUser({ id: 'solo', firstName: 'S', lastName: 'T', email: 's@x.io', tenantId: TENANT });
    expect((await award('solo', 'p1')).groupIds).toEqual([]);
    expect(
      (
        await service.recordAward(
          { userId: 'a', source: PointSource.ADMIN_ADJUSTMENT, refId: 'x', delta: 5, awardedAt: NOW },
          NOW,
        )
      ).activity,
    ).toBeNull();
  });

  it('completes a group total goal exactly once and notifies every member', async () => {
    const goal = repository.seedGoal({
      groupId,
      metric: StudyGoalMetric.PROBLEMS_SOLVED,
      scope: StudyGoalScope.GROUP_TOTAL,
      target: 2,
    });

    await award('a', 'p1');
    expect(completed).toHaveLength(0);
    await award('b', 'p2');
    await award('a', 'p3');

    expect(repository.completions).toEqual([goal.id]);
    expect(completed.map((event) => [event.recipientId, event.dedupeKey, event.personal])).toEqual([
      ['a', `goal:${goal.id}:a`, false],
      ['b', `goal:${goal.id}:b`, false],
    ]);
  });

  it('notifies each member who reaches an each-member goal and completes it when all do', async () => {
    const goal = repository.seedGoal({
      groupId,
      metric: StudyGoalMetric.POINTS,
      scope: StudyGoalScope.EACH_MEMBER,
      target: 20,
    });

    await award('a', 'p1');
    await award('a', 'p2');
    expect(completed.map((event) => [event.recipientId, event.dedupeKey, event.personal])).toEqual([
      ['a', `goal:${goal.id}:a`, true],
    ]);
    expect(repository.completions).toEqual([]);

    await award('b', 'p3', PointSource.DAILY_CHALLENGE);
    await award('b', 'p4');
    expect(completed.map((event) => event.recipientId)).toEqual(['a', 'b']);
    expect(repository.completions).toEqual([goal.id]);
  });

  it('ignores goals whose metric the award does not move', async () => {
    repository.seedGoal({ groupId, metric: StudyGoalMetric.DAILY_CHALLENGES, target: 1 });
    await award('a', 'p1');
    expect(completed).toHaveLength(0);
  });
});
