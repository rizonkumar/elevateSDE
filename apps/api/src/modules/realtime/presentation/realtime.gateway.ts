import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { REALTIME_NAMESPACE, RealtimeAck } from '@elevatesde/shared-types';
import { RealtimeAuthenticator } from '../application/realtime-authenticator.service';
import { ROOM_ERRORS, RoomAuthorizerRegistry, toAck } from '../application/room-authorizer.registry';
import { REALTIME_AUTH_ERRORS, RealtimeAuthError } from '../domain/realtime-identity';
import { ParsedRoom, parseRoom, userRoom } from '../domain/realtime-room';
import { SubscriptionRateLimiter } from '../domain/subscription-rate-limiter';
import { millisecondsUntilExpiry } from '../domain/token-expiry';
import { SocketIoRealtimePublisher } from '../infrastructure/socket-io-realtime.publisher';
import { RealtimeNamespace, RealtimeSocket } from '../infrastructure/realtime-socket.types';

type NextFunction = (error?: Error) => void;

@WebSocketGateway({ namespace: REALTIME_NAMESPACE })
export class RealtimeGateway
  implements OnGatewayInit<RealtimeNamespace>, OnGatewayConnection<RealtimeSocket>, OnGatewayDisconnect<RealtimeSocket>
{
  private readonly logger = new Logger(RealtimeGateway.name);
  private namespace: RealtimeNamespace | null = null;
  private readonly expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly rateLimiters = new Map<string, SubscriptionRateLimiter>();
  private readonly departingPeerRooms = new Map<string, ParsedRoom[]>();

  constructor(
    private readonly authenticator: RealtimeAuthenticator,
    private readonly registry: RoomAuthorizerRegistry,
    private readonly publisher: SocketIoRealtimePublisher,
  ) {}

  afterInit(namespace: RealtimeNamespace): void {
    this.namespace = namespace;
    this.publisher.attach(namespace);
    namespace.use((socket, next) => {
      void this.authenticateSocket(socket, next);
    });
  }

  async authenticateSocket(socket: RealtimeSocket, next: NextFunction): Promise<void> {
    try {
      const auth: Record<string, unknown> = socket.handshake.auth;
      socket.data = await this.authenticator.authenticate(auth.token);
      next();
    } catch (error) {
      const code =
        error instanceof RealtimeAuthError ? error.code : REALTIME_AUTH_ERRORS.UNAUTHORIZED;
      next(new Error(code));
    }
  }

  async handleConnection(socket: RealtimeSocket): Promise<void> {
    const { userId, expiresAt } = socket.data;
    await socket.join(userRoom(userId));
    this.scheduleExpiry(socket, expiresAt);
    socket.on('disconnecting', () => {
      const peerRooms = [...socket.rooms]
        .map((name) => parseRoom(name))
        .filter((room): room is ParsedRoom => room?.kind === 'peer');
      if (peerRooms.length > 0) {
        this.departingPeerRooms.set(socket.id, peerRooms);
      }
    });
  }

  async handleDisconnect(socket: RealtimeSocket): Promise<void> {
    const timer = this.expiryTimers.get(socket.id);
    if (timer) {
      clearTimeout(timer);
    }
    this.expiryTimers.delete(socket.id);
    this.rateLimiters.delete(socket.id);
    const peerRooms = this.departingPeerRooms.get(socket.id) ?? [];
    this.departingPeerRooms.delete(socket.id);
    await Promise.all(
      peerRooms.map((room) => this.announceDepartureIfLast(room, socket.data.userId)),
    );
  }

  @SubscribeMessage('room:subscribe')
  async subscribe(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() value: unknown,
  ): Promise<RealtimeAck> {
    if (!this.consumeRateLimit(socket)) {
      return { ok: false, error: ROOM_ERRORS.RATE_LIMITED };
    }
    const authorization = await this.registry.authorize(
      { userId: socket.data.userId, tenantId: socket.data.tenantId },
      value,
    );
    if (!authorization.ok) {
      return toAck(authorization);
    }
    const { room } = authorization;
    await socket.join(room.name);
    if (room.kind === 'peer') {
      await this.announceArrival(socket, room);
    }
    return { ok: true };
  }

  @SubscribeMessage('room:unsubscribe')
  async unsubscribe(
    @ConnectedSocket() socket: RealtimeSocket,
    @MessageBody() value: unknown,
  ): Promise<RealtimeAck> {
    if (!this.consumeRateLimit(socket)) {
      return { ok: false, error: ROOM_ERRORS.RATE_LIMITED };
    }
    const room = parseRoom(value);
    if (!room) {
      return { ok: false, error: ROOM_ERRORS.INVALID_ROOM };
    }
    if (!socket.rooms.has(room.name)) {
      return { ok: true };
    }
    await socket.leave(room.name);
    if (room.kind === 'peer') {
      await this.announceDepartureIfLast(room, socket.data.userId);
    }
    return { ok: true };
  }

  scheduleExpiry(socket: RealtimeSocket, expiresAt: number): void {
    const timer = setTimeout(
      () => {
        this.expiryTimers.delete(socket.id);
        socket.disconnect(true);
      },
      millisecondsUntilExpiry(expiresAt, Date.now()),
    );
    this.expiryTimers.set(socket.id, timer);
  }

  private consumeRateLimit(socket: RealtimeSocket): boolean {
    let limiter = this.rateLimiters.get(socket.id);
    if (!limiter) {
      limiter = new SubscriptionRateLimiter();
      this.rateLimiters.set(socket.id, limiter);
    }
    return limiter.tryConsume(Date.now());
  }

  private async announceArrival(socket: RealtimeSocket, room: ParsedRoom): Promise<void> {
    const onlineUserIds = await this.onlineUserIds(room);
    socket.emit('peer:presence-snapshot', { sessionId: room.resourceId, onlineUserIds });
    socket.to(room.name).emit('peer:presence', {
      sessionId: room.resourceId,
      userId: socket.data.userId,
      online: true,
    });
  }

  private async announceDepartureIfLast(room: ParsedRoom, userId: string): Promise<void> {
    if (!this.namespace) {
      return;
    }
    try {
      const stillOnline = await this.onlineUserIds(room);
      if (stillOnline.includes(userId)) {
        return;
      }
      this.namespace
        .to(room.name)
        .emit('peer:presence', { sessionId: room.resourceId, userId, online: false });
    } catch (error) {
      this.logger.warn(
        `Could not announce departure from ${room.name}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private async onlineUserIds(room: ParsedRoom): Promise<string[]> {
    if (!this.namespace) {
      return [];
    }
    const sockets = await this.namespace.in(room.name).fetchSockets();
    return [...new Set(sockets.map((remote) => remote.data.userId))];
  }
}
