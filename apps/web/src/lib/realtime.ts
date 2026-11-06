import { io, Socket } from 'socket.io-client';
import {
  REALTIME_NAMESPACE,
  type ClientToServerEvents,
  type ServerToClientEventName,
  type ServerToClientEvents,
  type ServerToClientPayload,
} from '@elevatesde/shared-types';
import { API_BASE_URL, accessToken, renewSession } from '@/lib/api';
import { type RealtimeStatus, useRealtimeStore } from '@/store/realtime.store';

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const UNAUTHORIZED = 'unauthorized';
const FORBIDDEN = 'forbidden';
const SERVER_DISCONNECT = 'io server disconnect';
const MAX_RENEW_ATTEMPTS = 3;
const RENEW_RETRY_DELAY_MS = 2_000;

type EventHandler<E extends ServerToClientEventName> = (payload: ServerToClientPayload<E>) => void;

type HandlerRegistry = { [E in ServerToClientEventName]: Set<EventHandler<E>> };

const handlers: HandlerRegistry = {
  'notification:new': new Set(),
  'notification:unread-count': new Set(),
  'contest:standings': new Set(),
  'contest:status': new Set(),
  'peer:presence': new Set(),
  'peer:presence-snapshot': new Set(),
  'peer:session-changed': new Set(),
  'group:activity': new Set(),
};

function isServerEvent(name: string): name is ServerToClientEventName {
  return Object.hasOwn(handlers, name);
}

function dispatch<E extends ServerToClientEventName>(event: E, payload: unknown): void {
  const registered: Set<EventHandler<E>> = handlers[event];
  for (const handler of registered) {
    handler(payload as ServerToClientPayload<E>);
  }
}

export function onRealtimeEvent<E extends ServerToClientEventName>(
  event: E,
  handler: EventHandler<E>,
): () => void {
  const registered: Set<EventHandler<E>> = handlers[event];
  registered.add(handler);
  return () => {
    registered.delete(handler);
  };
}

let socket: RealtimeSocket | null = null;
let renewAttempts = 0;
let renewing = false;
let wanted = false;

function setStatus(status: RealtimeStatus): void {
  useRealtimeStore.getState().setStatus(status);
}

async function renewAndReconnect(target: RealtimeSocket): Promise<void> {
  if (renewing || !wanted) {
    return;
  }
  if (renewAttempts >= MAX_RENEW_ATTEMPTS) {
    setStatus('unavailable');
    return;
  }
  renewing = true;
  renewAttempts += 1;
  setStatus('connecting');
  const token = await renewSession();
  renewing = false;
  if (!wanted) {
    setStatus('unavailable');
    return;
  }
  if (!token) {
    setTimeout(() => void renewAndReconnect(target), RENEW_RETRY_DELAY_MS * renewAttempts);
    return;
  }
  target.connect();
}

function createSocket(): RealtimeSocket {
  const created: RealtimeSocket = io(`${API_BASE_URL}${REALTIME_NAMESPACE}`, {
    autoConnect: false,
    auth: (callback) => callback({ token: accessToken() ?? '' }),
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 15_000,
  });
  created.onAny((name: string, payload: unknown) => {
    if (isServerEvent(name)) {
      dispatch(name, payload);
    }
  });
  created.on('connect', () => {
    renewAttempts = 0;
    setStatus('connected');
  });
  created.on('disconnect', (reason) => {
    if (!wanted) {
      setStatus('idle');
      return;
    }
    setStatus('disconnected');
    if (reason === SERVER_DISCONNECT) {
      void renewAndReconnect(created);
    }
  });
  created.on('connect_error', (error) => {
    if (error.message === FORBIDDEN) {
      setStatus('unavailable');
      return;
    }
    if (error.message === UNAUTHORIZED) {
      void renewAndReconnect(created);
      return;
    }
    setStatus('disconnected');
  });
  return created;
}

export function getRealtimeSocket(): RealtimeSocket {
  socket ??= createSocket();
  return socket;
}

export function connectRealtime(): void {
  if (!accessToken()) {
    return;
  }
  wanted = true;
  const target = getRealtimeSocket();
  if (!target.connected && !target.active) {
    setStatus('connecting');
    target.connect();
  }
}

export function disconnectRealtime(): void {
  wanted = false;
  renewAttempts = 0;
  socket?.disconnect();
  setStatus('idle');
}
