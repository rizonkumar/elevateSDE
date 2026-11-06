import type { ServerToClientEventName, ServerToClientPayload } from '@elevatesde/shared-types';

export abstract class RealtimePublisher {
  abstract toUser<E extends ServerToClientEventName>(
    userId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void;
  abstract toContest<E extends ServerToClientEventName>(
    contestId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void;
  abstract toPeerSession<E extends ServerToClientEventName>(
    sessionId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void;
  abstract toGroup<E extends ServerToClientEventName>(
    groupId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void;
}
