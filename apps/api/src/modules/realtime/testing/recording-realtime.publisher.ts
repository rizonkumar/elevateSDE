import type { ServerToClientEventName, ServerToClientPayload } from '@elevatesde/shared-types';
import { RealtimePublisher } from '../domain/realtime-publisher';

export interface RecordedEviction {
  groupId: string;
  userId: string | null;
}

export type RealtimeTarget = 'user' | 'contest' | 'peer' | 'group';

export interface RecordedRealtimeEvent {
  target: RealtimeTarget;
  id: string;
  event: ServerToClientEventName;
  payload: unknown;
}

export class RecordingRealtimePublisher extends RealtimePublisher {
  readonly events: RecordedRealtimeEvent[] = [];
  readonly evictions: RecordedEviction[] = [];

  toUser<E extends ServerToClientEventName>(
    userId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void {
    this.events.push({ target: 'user', id: userId, event, payload });
  }

  toContest<E extends ServerToClientEventName>(
    contestId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void {
    this.events.push({ target: 'contest', id: contestId, event, payload });
  }

  toPeerSession<E extends ServerToClientEventName>(
    sessionId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void {
    this.events.push({ target: 'peer', id: sessionId, event, payload });
  }

  toGroup<E extends ServerToClientEventName>(
    groupId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void {
    this.events.push({ target: 'group', id: groupId, event, payload });
  }

  evictUserFromGroup(groupId: string, userId: string): void {
    this.evictions.push({ groupId, userId });
  }

  evictAllFromGroup(groupId: string): void {
    this.evictions.push({ groupId, userId: null });
  }

  eventsNamed(event: ServerToClientEventName): RecordedRealtimeEvent[] {
    return this.events.filter((recorded) => recorded.event === event);
  }
}
