import type { PeerPracticeStatus } from '@elevatesde/shared-types';

export type PeerParticipantRole = 'ORGANIZER' | 'INVITEE';

const TRANSITIONS: Record<PeerPracticeStatus, PeerPracticeStatus[]> = {
  PENDING: ['ACCEPTED', 'DECLINED', 'CANCELLED'],
  ACCEPTED: ['CANCELLED', 'COMPLETED', 'NO_SHOW'],
  DECLINED: [],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

export class PeerPracticeSession {
  static assertMeetingUrl(value: string): void {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new RangeError('Meeting link must be a valid HTTPS URL');
    }
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new RangeError('Meeting link must be a valid HTTPS URL');
    }
  }

  static assertSchedule(startsAt: Date, durationMinutes: number, timeZone: string, now: Date): void {
    if (!Number.isFinite(startsAt.getTime()) || startsAt <= now) {
      throw new RangeError('Peer practice must be scheduled in the future');
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 180) {
      throw new RangeError('Duration must be between 15 and 180 minutes');
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format(startsAt);
    } catch {
      throw new RangeError('Time zone must be a valid IANA identifier');
    }
  }

  static assertTransition(
    current: PeerPracticeStatus,
    next: PeerPracticeStatus,
    actor: PeerParticipantRole,
    startsAt: Date,
    now: Date,
  ): void {
    if (!TRANSITIONS[current].includes(next)) {
      throw new RangeError(`Cannot move a ${current.toLowerCase()} session to ${next.toLowerCase()}`);
    }
    if ((next === 'ACCEPTED' || next === 'DECLINED') && actor !== 'INVITEE') {
      throw new RangeError('Only the invitee can respond to an invitation');
    }
    if (next === 'CANCELLED' && current === 'PENDING' && actor !== 'ORGANIZER') {
      throw new RangeError('Only the organizer can cancel a pending invitation');
    }
    if ((next === 'COMPLETED' || next === 'NO_SHOW') && startsAt > now) {
      throw new RangeError('A future session cannot be completed or marked no-show');
    }
  }
}
