import { Injectable } from '@nestjs/common';
import type {
  ServerToClientEventName,
  ServerToClientEvents,
  ServerToClientPayload,
} from '@elevatesde/shared-types';
import { RealtimePublisher } from '../domain/realtime-publisher';
import { roomName, userRoom } from '../domain/realtime-room';
import { RealtimeNamespace } from './realtime-socket.types';

@Injectable()
export class SocketIoRealtimePublisher extends RealtimePublisher {
  private namespace: RealtimeNamespace | null = null;

  attach(namespace: RealtimeNamespace): void {
    this.namespace = namespace;
  }

  toUser<E extends ServerToClientEventName>(
    userId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void {
    this.emit(userRoom(userId), event, payload);
  }

  toContest<E extends ServerToClientEventName>(
    contestId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void {
    this.emit(roomName('contest', contestId), event, payload);
  }

  toPeerSession<E extends ServerToClientEventName>(
    sessionId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void {
    this.emit(roomName('peer', sessionId), event, payload);
  }

  toGroup<E extends ServerToClientEventName>(
    groupId: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void {
    this.emit(roomName('group', groupId), event, payload);
  }

  private emit<E extends ServerToClientEventName>(
    room: string,
    event: E,
    payload: ServerToClientPayload<E>,
  ): void {
    if (!this.namespace) {
      return;
    }
    const args = [payload] as Parameters<ServerToClientEvents[E]>;
    this.namespace.to(room).emit(event, ...args);
  }
}
