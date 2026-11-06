import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io, Socket as ClientSocket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  NotificationPushDto,
  PeerPresencePushDto,
  PeerPresenceSnapshotDto,
  RealtimeAck,
  ServerToClientEvents,
  StudyGroupActivityItemDto,
} from '@elevatesde/shared-types';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeAuthenticator } from '../application/realtime-authenticator.service';
import { RoomAuthorizerRegistry } from '../application/room-authorizer.registry';
import { RealtimePublisher } from '../domain/realtime-publisher';
import { REALTIME_AUTH_ERRORS, RealtimeAuthError, RealtimeIdentity } from '../domain/realtime-identity';
import { SUBSCRIBE_LIMIT } from '../domain/subscription-rate-limiter';
import { SocketIoRealtimePublisher } from '../infrastructure/socket-io-realtime.publisher';
import { RealtimeSocket } from '../infrastructure/realtime-socket.types';

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

const SESSION_ID = '33333333-3333-4333-8333-333333333333';
const CONTEST_ID = '44444444-4444-4444-8444-444444444444';
const GROUP_ID = '55555555-5555-4555-8555-555555555555';
const PARTICIPANTS = new Set(['user-1', 'user-2']);

class FakeAuthenticator {
  async authenticate(token: unknown): Promise<RealtimeIdentity> {
    if (token === 'inactive') {
      throw new RealtimeAuthError(REALTIME_AUTH_ERRORS.FORBIDDEN);
    }
    if (typeof token !== 'string' || !token.startsWith('user-')) {
      throw new RealtimeAuthError(REALTIME_AUTH_ERRORS.UNAUTHORIZED);
    }
    return { userId: token, tenantId: null, expiresAt: Date.now() + 60_000 };
  }
}

function waitFor<T>(register: (resolve: (value: T) => void) => void, timeoutMs = 2000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for event')), timeoutMs);
    register((value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
}

function groupItem(): StudyGroupActivityItemDto {
  return {
    id: 'a:PROBLEM_SOLVED:p1',
    userId: 'user-1',
    displayName: 'Ada',
    publicHandle: null,
    kind: 'PROBLEM_SOLVED',
    title: 'Two Sum',
    linkUrl: null,
    points: 10,
    occurredAt: new Date(0).toISOString(),
  };
}

function subscribe(client: TestClient, room: string): Promise<RealtimeAck> {
  return new Promise((resolve) => client.emit('room:subscribe', room, resolve));
}

describe('RealtimeGateway over Socket.io', () => {
  let app: INestApplication;
  let url: string;
  let publisher: RealtimePublisher;
  const clients: TestClient[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        RoomAuthorizerRegistry,
        SocketIoRealtimePublisher,
        { provide: RealtimePublisher, useExisting: SocketIoRealtimePublisher },
        { provide: RealtimeAuthenticator, useClass: FakeAuthenticator },
      ],
    }).compile();
    const registry = moduleRef.get(RoomAuthorizerRegistry);
    registry.register({ kind: 'peer', canJoin: async (viewer) => PARTICIPANTS.has(viewer.userId) });
    registry.register({ kind: 'contest', canJoin: async () => true });
    registry.register({ kind: 'group', canJoin: async () => true });
    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    const server: Server = app.getHttpServer();
    const { port } = server.address() as AddressInfo;
    url = `http://127.0.0.1:${port}/realtime`;
    publisher = moduleRef.get(RealtimePublisher);
  });

  afterEach(() => {
    for (const client of clients.splice(0)) {
      client.disconnect();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  function connect(token: string): TestClient {
    const client: TestClient = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
    });
    clients.push(client);
    return client;
  }

  async function connected(token: string): Promise<TestClient> {
    const client = connect(token);
    await waitFor<void>((resolve) => client.on('connect', () => resolve()));
    return client;
  }

  it.each([
    ['missing', '', 'unauthorized'],
    ['invalid', 'not-a-token', 'unauthorized'],
    ['inactive', 'inactive', 'forbidden'],
  ])('rejects a handshake with a %s token', async (_label, token, code) => {
    const client = connect(token);
    const error = await waitFor<Error>((resolve) => client.on('connect_error', resolve));
    expect(error.message).toBe(code);
  });

  it('delivers user events only to that user', async () => {
    const recipient = await connected('user-1');
    const bystander = await connected('user-9');
    const strayEvents: NotificationPushDto[] = [];
    bystander.on('notification:new', (payload) => strayEvents.push(payload));
    const received = waitFor<NotificationPushDto>((resolve) =>
      recipient.on('notification:new', resolve),
    );

    publisher.toUser('user-1', 'notification:new', {
      notification: {
        id: 'n1',
        type: 'SYSTEM',
        title: 'Hello',
        body: 'World',
        linkUrl: null,
        isRead: false,
        createdAt: new Date(0).toISOString(),
      },
      unreadCount: 3,
    });

    await expect(received).resolves.toMatchObject({ unreadCount: 3 });
    expect(strayEvents).toHaveLength(0);
  });

  it('rejects a peer room for a non-participant and an invalid room name', async () => {
    const stranger = await connected('user-9');
    await expect(subscribe(stranger, `peer:${SESSION_ID}`)).resolves.toEqual({
      ok: false,
      error: 'forbidden',
    });
    await expect(subscribe(stranger, 'user:user-1')).resolves.toEqual({
      ok: false,
      error: 'invalid_room',
    });
  });

  it('delivers contest events to subscribers only', async () => {
    const watcher = await connected('user-1');
    await expect(subscribe(watcher, `contest:${CONTEST_ID}`)).resolves.toEqual({ ok: true });
    const status = waitFor((resolve) => watcher.on('contest:status', resolve));

    publisher.toContest(CONTEST_ID, 'contest:status', {
      contestId: CONTEST_ID,
      status: 'LIVE',
      finalized: false,
      rated: false,
    });

    await expect(status).resolves.toEqual({
      contestId: CONTEST_ID,
      status: 'LIVE',
      finalized: false,
      rated: false,
    });
  });

  it('tracks peer presence for arrivals and departures', async () => {
    const organizer = await connected('user-1');
    await expect(subscribe(organizer, `peer:${SESSION_ID}`)).resolves.toEqual({ ok: true });

    const invitee = await connected('user-2');
    const arrival = waitFor<PeerPresencePushDto>((resolve) =>
      organizer.on('peer:presence', resolve),
    );
    const snapshot = waitFor<PeerPresenceSnapshotDto>((resolve) =>
      invitee.on('peer:presence-snapshot', resolve),
    );
    await expect(subscribe(invitee, `peer:${SESSION_ID}`)).resolves.toEqual({ ok: true });

    await expect(arrival).resolves.toEqual({ sessionId: SESSION_ID, userId: 'user-2', online: true });
    const { onlineUserIds } = await snapshot;
    expect([...onlineUserIds].sort()).toEqual(['user-1', 'user-2']);

    const departure = waitFor<PeerPresencePushDto>((resolve) =>
      organizer.on('peer:presence', resolve),
    );
    invitee.disconnect();
    await expect(departure).resolves.toEqual({ sessionId: SESSION_ID, userId: 'user-2', online: false });
  });

  it('stops delivering group events to a member evicted from the room', async () => {
    const evicted = await connected('user-1');
    const remaining = await connected('user-2');
    await subscribe(evicted, `group:${GROUP_ID}`);
    await subscribe(remaining, `group:${GROUP_ID}`);
    const leaked: unknown[] = [];
    evicted.on('group:activity', (payload) => leaked.push(payload));
    const delivered = waitFor((resolve) => remaining.on('group:activity', resolve));

    publisher.evictUserFromGroup(GROUP_ID, 'user-1');
    await new Promise((resolve) => setTimeout(resolve, 50));
    publisher.toGroup(GROUP_ID, 'group:activity', { groupId: GROUP_ID, item: groupItem() });

    await expect(delivered).resolves.toMatchObject({ groupId: GROUP_ID });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(leaked).toHaveLength(0);
  });

  it('stops delivering group events to everyone once the group is evicted', async () => {
    const first = await connected('user-1');
    const second = await connected('user-2');
    await subscribe(first, `group:${GROUP_ID}`);
    await subscribe(second, `group:${GROUP_ID}`);
    const leaked: unknown[] = [];
    first.on('group:activity', (payload) => leaked.push(payload));
    second.on('group:activity', (payload) => leaked.push(payload));

    publisher.evictAllFromGroup(GROUP_ID);
    await new Promise((resolve) => setTimeout(resolve, 50));
    publisher.toGroup(GROUP_ID, 'group:activity', { groupId: GROUP_ID, item: groupItem() });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(leaked).toHaveLength(0);
  });

  it('rate limits room subscriptions per socket', async () => {
    const client = await connected('user-1');
    const acks: RealtimeAck[] = [];
    for (let attempt = 0; attempt <= SUBSCRIBE_LIMIT; attempt += 1) {
      acks.push(await subscribe(client, `contest:${CONTEST_ID}`));
    }
    expect(acks.slice(0, SUBSCRIBE_LIMIT).every((ack) => ack.ok)).toBe(true);
    expect(acks[SUBSCRIBE_LIMIT]).toEqual({ ok: false, error: 'rate_limited' });
  });
});

describe('RealtimeGateway token expiry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('disconnects the socket when the access token expires', () => {
    const gateway = new RealtimeGateway(
      new FakeAuthenticator() as unknown as RealtimeAuthenticator,
      new RoomAuthorizerRegistry(),
      new SocketIoRealtimePublisher(),
    );
    const disconnect = jest.fn();
    const socket = { id: 'socket-1', disconnect } as unknown as RealtimeSocket;

    gateway.scheduleExpiry(socket, Date.now() + 5_000);
    jest.advanceTimersByTime(4_999);
    expect(disconnect).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(disconnect).toHaveBeenCalledWith(true);
  });

  it('does not disconnect after the socket has already left', async () => {
    const gateway = new RealtimeGateway(
      new FakeAuthenticator() as unknown as RealtimeAuthenticator,
      new RoomAuthorizerRegistry(),
      new SocketIoRealtimePublisher(),
    );
    const disconnect = jest.fn();
    const socket = {
      id: 'socket-2',
      disconnect,
      data: { userId: 'user-1', tenantId: null, expiresAt: Date.now() + 5_000 },
    } as unknown as RealtimeSocket;

    gateway.scheduleExpiry(socket, Date.now() + 5_000);
    await gateway.handleDisconnect(socket);
    jest.advanceTimersByTime(10_000);
    expect(disconnect).not.toHaveBeenCalled();
  });
});
