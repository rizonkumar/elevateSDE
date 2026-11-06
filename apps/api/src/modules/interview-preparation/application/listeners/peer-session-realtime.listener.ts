import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { PeerSessionChangeStatus } from '@elevatesde/shared-types';
import {
  NOTIFICATION_EVENTS,
  PeerSessionChangedEvent,
} from '../../../notification/domain/events/notification-events';
import { RealtimePublisher } from '../../../realtime/domain/realtime-publisher';

const CHANGE_STATUSES: readonly PeerSessionChangeStatus[] = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
  'RESCHEDULED',
];

function toChangeStatus(value: string): PeerSessionChangeStatus | null {
  return CHANGE_STATUSES.find((status) => status === value) ?? null;
}

@Injectable()
export class PeerSessionRealtimeListener {
  constructor(private readonly realtime: RealtimePublisher) {}

  @OnEvent(NOTIFICATION_EVENTS.PEER_SESSION_CHANGED)
  onPeerSessionChanged(event: PeerSessionChangedEvent): void {
    const status = toChangeStatus(event.status);
    if (!status) {
      return;
    }
    this.realtime.toPeerSession(event.sessionId, 'peer:session-changed', {
      sessionId: event.sessionId,
      status,
    });
  }
}
