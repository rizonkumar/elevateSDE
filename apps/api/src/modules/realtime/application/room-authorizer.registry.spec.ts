import { RoomAuthorizerRegistry } from './room-authorizer.registry';
import { RealtimeViewer, RoomAuthorizer } from '../domain/room-authorizer';

const CONTEST_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const VIEWER: RealtimeViewer = { userId: 'user-1', tenantId: null };

function authorizer(kind: RoomAuthorizer['kind'], allowed: (id: string) => boolean): RoomAuthorizer {
  return { kind, canJoin: async (_viewer, id) => allowed(id) };
}

describe('RoomAuthorizerRegistry', () => {
  it('admits a room when its authorizer allows it', async () => {
    const registry = new RoomAuthorizerRegistry();
    registry.register(authorizer('contest', () => true));

    await expect(registry.authorize(VIEWER, `contest:${CONTEST_ID}`)).resolves.toEqual({
      ok: true,
      room: { kind: 'contest', resourceId: CONTEST_ID, name: `contest:${CONTEST_ID}` },
    });
  });

  it('rejects a room the authorizer denies, such as a draft contest or a stranger peer session', async () => {
    const registry = new RoomAuthorizerRegistry();
    registry.register(authorizer('contest', () => false));
    registry.register(authorizer('peer', () => false));

    await expect(registry.authorize(VIEWER, `contest:${CONTEST_ID}`)).resolves.toEqual({
      ok: false,
      error: 'forbidden',
    });
    await expect(registry.authorize(VIEWER, `peer:${SESSION_ID}`)).resolves.toEqual({
      ok: false,
      error: 'forbidden',
    });
  });

  it.each([
    'user:11111111-1111-4111-8111-111111111111',
    'contest:not-a-uuid',
    'contest',
    42,
    null,
    `group:${CONTEST_ID}`,
  ])('rejects invalid or unregistered room %p', async (room) => {
    const registry = new RoomAuthorizerRegistry();
    registry.register(authorizer('contest', () => true));

    await expect(registry.authorize(VIEWER, room)).resolves.toEqual({
      ok: false,
      error: 'invalid_room',
    });
  });

  it('treats an authorizer failure as forbidden', async () => {
    const registry = new RoomAuthorizerRegistry();
    registry.register({
      kind: 'peer',
      canJoin: async () => {
        throw new Error('database down');
      },
    });

    await expect(registry.authorize(VIEWER, `peer:${SESSION_ID}`)).resolves.toEqual({
      ok: false,
      error: 'forbidden',
    });
  });
});
