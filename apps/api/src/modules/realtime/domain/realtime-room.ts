import type { RealtimeRoom, RealtimeRoomKind } from '@elevatesde/shared-types';

const ROOM_KINDS: readonly RealtimeRoomKind[] = ['contest', 'peer', 'group'];
const RESOURCE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ParsedRoom {
  kind: RealtimeRoomKind;
  resourceId: string;
  name: RealtimeRoom;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function roomName(kind: RealtimeRoomKind, resourceId: string): RealtimeRoom {
  return `${kind}:${resourceId}`;
}

export function parseRoom(value: unknown): ParsedRoom | null {
  if (typeof value !== 'string') {
    return null;
  }
  const separator = value.indexOf(':');
  if (separator <= 0) {
    return null;
  }
  const kind = ROOM_KINDS.find((candidate) => candidate === value.slice(0, separator));
  const resourceId = value.slice(separator + 1);
  if (!kind || !RESOURCE_ID_PATTERN.test(resourceId)) {
    return null;
  }
  return { kind, resourceId, name: roomName(kind, resourceId) };
}
