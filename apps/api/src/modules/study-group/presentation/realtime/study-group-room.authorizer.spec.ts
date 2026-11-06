import { EventEmitter2 } from '@nestjs/event-emitter';
import { StudyGroupRole } from '@prisma/client';
import { RoomAuthorizerRegistry } from '../../../realtime/application/room-authorizer.registry';
import { RecordingRealtimePublisher } from '../../../realtime/testing/recording-realtime.publisher';
import { StudyGroupService } from '../../application/study-group.service';
import { FakeStudyGroupRepository } from '../../testing/fake-study-group.repository';
import { StudyGroupRoomAuthorizer } from './study-group-room.authorizer';

const GROUP_ID = '11111111-1111-4111-8111-111111111111';

describe('StudyGroupRoomAuthorizer', () => {
  let registry: RoomAuthorizerRegistry;

  beforeEach(() => {
    const repository = new FakeStudyGroupRepository();
    repository.addUser({ id: 'member', firstName: 'M', lastName: 'T', email: 'm@x.io', tenantId: 't1' });
    repository.addUser({ id: 'peer', firstName: 'P', lastName: 'T', email: 'p@x.io', tenantId: 't1' });
    repository.addUser({ id: 'other', firstName: 'O', lastName: 'T', email: 'o@x.io', tenantId: 't2' });
    repository.seedGroup({ id: GROUP_ID, tenantId: 't1', name: 'Cohort' });
    repository.seedMember(GROUP_ID, 'member', StudyGroupRole.MEMBER);
    registry = new RoomAuthorizerRegistry();
    new StudyGroupRoomAuthorizer(
      registry,
      new StudyGroupService(repository, new EventEmitter2(), new RecordingRealtimePublisher()),
    ).onModuleInit();
  });

  it('lets members subscribe to their group room', async () => {
    await expect(
      registry.authorize({ userId: 'member', tenantId: 't1' }, `group:${GROUP_ID}`),
    ).resolves.toMatchObject({ ok: true });
  });

  it('rejects non-members and other tenants', async () => {
    await expect(
      registry.authorize({ userId: 'peer', tenantId: 't1' }, `group:${GROUP_ID}`),
    ).resolves.toEqual({ ok: false, error: 'forbidden' });
    await expect(
      registry.authorize({ userId: 'other', tenantId: 't2' }, `group:${GROUP_ID}`),
    ).resolves.toEqual({ ok: false, error: 'forbidden' });
  });
});
