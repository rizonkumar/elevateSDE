'use client';

import * as React from 'react';
import type {
  RealtimeAck,
  RealtimeRoom,
  ServerToClientEventName,
  ServerToClientPayload,
} from '@elevatesde/shared-types';
import {
  connectRealtime,
  disconnectRealtime,
  getRealtimeSocket,
  onRealtimeEvent,
} from '@/lib/realtime';
import { useAuthStore } from '@/store/auth.store';
import { useRealtimeStore } from '@/store/realtime.store';

export function useRealtimeConnection(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  React.useEffect(() => {
    if (!isAuthenticated) {
      disconnectRealtime();
      return;
    }
    connectRealtime();
    return () => disconnectRealtime();
  }, [isAuthenticated]);
}

export function useRealtimeConnected(): boolean {
  return useRealtimeStore((state) => state.status === 'connected');
}

export function useRealtimeEvent<E extends ServerToClientEventName>(
  event: E,
  handler: (payload: ServerToClientPayload<E>) => void,
): void {
  const handlerRef = React.useRef(handler);

  React.useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  React.useEffect(() => {
    return onRealtimeEvent(event, (payload) => handlerRef.current(payload));
  }, [event]);
}

export function useRealtimeRoom(room: RealtimeRoom | null): boolean {
  const connected = useRealtimeConnected();
  const [joinedRoom, setJoinedRoom] = React.useState<RealtimeRoom | null>(null);

  React.useEffect(() => {
    if (!room || !connected) {
      return;
    }
    const socket = getRealtimeSocket();
    let cancelled = false;
    const join = () => {
      socket.emit('room:subscribe', room, (ack: RealtimeAck) => {
        if (!cancelled) {
          setJoinedRoom(ack.ok ? room : null);
        }
      });
    };
    join();
    socket.on('connect', join);
    return () => {
      cancelled = true;
      socket.off('connect', join);
      setJoinedRoom(null);
      if (socket.connected) {
        socket.emit('room:unsubscribe', room, () => undefined);
      }
    };
  }, [room, connected]);

  return connected && room !== null && joinedRoom === room;
}
