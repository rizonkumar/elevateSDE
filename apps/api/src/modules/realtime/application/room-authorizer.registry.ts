import { Injectable, Logger } from '@nestjs/common';
import type { RealtimeAck, RealtimeRoomKind } from '@elevatesde/shared-types';
import { ParsedRoom, parseRoom } from '../domain/realtime-room';
import { RealtimeViewer, RoomAuthorizer } from '../domain/room-authorizer';

export type RoomAuthorization = { ok: true; room: ParsedRoom } | { ok: false; error: string };

export const ROOM_ERRORS = {
  INVALID_ROOM: 'invalid_room',
  FORBIDDEN: 'forbidden',
  RATE_LIMITED: 'rate_limited',
} as const;

@Injectable()
export class RoomAuthorizerRegistry {
  private readonly logger = new Logger(RoomAuthorizerRegistry.name);
  private readonly authorizers = new Map<RealtimeRoomKind, RoomAuthorizer>();

  register(authorizer: RoomAuthorizer): void {
    this.authorizers.set(authorizer.kind, authorizer);
  }

  async authorize(viewer: RealtimeViewer, value: unknown): Promise<RoomAuthorization> {
    const room = parseRoom(value);
    if (!room) {
      return { ok: false, error: ROOM_ERRORS.INVALID_ROOM };
    }
    const authorizer = this.authorizers.get(room.kind);
    if (!authorizer) {
      return { ok: false, error: ROOM_ERRORS.INVALID_ROOM };
    }
    try {
      const allowed = await authorizer.canJoin(viewer, room.resourceId);
      return allowed ? { ok: true, room } : { ok: false, error: ROOM_ERRORS.FORBIDDEN };
    } catch (error) {
      this.logger.warn(
        `Room authorization failed for ${room.name}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return { ok: false, error: ROOM_ERRORS.FORBIDDEN };
    }
  }
}

export function toAck(authorization: RoomAuthorization): RealtimeAck {
  return authorization.ok ? { ok: true } : { ok: false, error: authorization.error };
}
