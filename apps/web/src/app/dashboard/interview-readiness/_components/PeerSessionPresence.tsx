'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import type { PeerPracticeSessionDto } from '@elevatesde/shared-types';
import { useNow } from '@/hooks/use-now';
import { useRealtimeEvent, useRealtimeRoom } from '@/hooks/use-realtime';
import { formatCountdown } from '@/lib/contest-time';
import { useInterviewReadinessStore } from '@/store/interview-readiness.store';

const MINUTE_MS = 60_000;

interface PeerSessionPresenceProps {
  session: PeerPracticeSessionDto;
  currentUserId: string | undefined;
}

function timingLabel(session: PeerPracticeSessionDto, now: number): string | null {
  const startsAt = new Date(session.startsAt).getTime();
  const endsAt = startsAt + session.durationMinutes * MINUTE_MS;
  if (now < startsAt) {
    return `Starts in ${formatCountdown(session.startsAt, now)}`;
  }
  if (now < endsAt) {
    return `In progress · ${formatCountdown(new Date(endsAt).toISOString(), now)} left`;
  }
  return null;
}

export function PeerSessionPresence({ session, currentUserId }: Readonly<PeerSessionPresenceProps>) {
  const isUpcoming = session.status === 'PENDING' || session.status === 'ACCEPTED';
  const room = isUpcoming ? (`peer:${session.id}` as const) : null;
  const joined = useRealtimeRoom(room);
  const refreshPeerSession = useInterviewReadinessStore((state) => state.refreshPeerSession);
  const [onlineUserIds, setOnlineUserIds] = React.useState<ReadonlySet<string>>(new Set());
  const now = useNow(1_000);

  const partnerId =
    session.organizer.id === currentUserId ? session.invitee.id : session.organizer.id;

  useRealtimeEvent('peer:presence-snapshot', (payload) => {
    if (payload.sessionId === session.id) {
      setOnlineUserIds(new Set(payload.onlineUserIds));
    }
  });

  useRealtimeEvent('peer:presence', (payload) => {
    if (payload.sessionId !== session.id) {
      return;
    }
    setOnlineUserIds((current) => {
      const next = new Set(current);
      if (payload.online) {
        next.add(payload.userId);
      } else {
        next.delete(payload.userId);
      }
      return next;
    });
  });

  useRealtimeEvent('peer:session-changed', (payload) => {
    if (payload.sessionId === session.id) {
      void refreshPeerSession(session.id);
    }
  });

  if (!isUpcoming) {
    return null;
  }

  const partnerOnline = joined && onlineUserIds.has(partnerId);
  const timing = timingLabel(session, now);

  if (!joined && !timing) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      {joined && (
        <span
          role="status"
          className={`inline-flex items-center gap-1.5 rounded-(--radius-full) border px-2.5 py-0.5 font-medium ${
            partnerOnline
              ? 'border-(--color-success)/30 bg-(--color-success-soft) text-(--color-success)'
              : 'border-(--color-border-subtle) bg-(--color-surface) text-(--color-text-muted)'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-(--radius-full) ${
              partnerOnline
                ? 'animate-pulse bg-(--color-success) motion-reduce:animate-none'
                : 'bg-(--color-text-disabled)'
            }`}
          />
          {partnerOnline ? 'Partner is here' : 'Partner is away'}
        </span>
      )}
      {timing && (
        <span className="inline-flex items-center gap-1.5 rounded-(--radius-full) border border-(--color-border-subtle) bg-(--color-surface) px-2.5 py-0.5 font-medium tabular-nums text-(--color-text-muted)">
          <Clock aria-hidden="true" className="h-3 w-3" />
          {timing}
        </span>
      )}
    </div>
  );
}
