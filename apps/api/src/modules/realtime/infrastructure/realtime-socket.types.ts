import type { Namespace, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@elevatesde/shared-types';
import { RealtimeIdentity } from '../domain/realtime-identity';

export type RealtimeSocketData = RealtimeIdentity;

export type InterServerEvents = Record<string, never>;

export type RealtimeNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  RealtimeSocketData
>;

export type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  RealtimeSocketData
>;
