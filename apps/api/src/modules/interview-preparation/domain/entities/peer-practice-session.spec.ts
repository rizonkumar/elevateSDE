import { PeerPracticeSession } from './peer-practice-session';

const now = new Date('2026-09-30T12:00:00.000Z');
const future = new Date('2026-10-01T12:00:00.000Z');
const past = new Date('2026-09-29T12:00:00.000Z');

describe('PeerPracticeSession', () => {
  it.each(['http://example.com', 'not-a-url', 'https://user:pass@example.com'])('rejects unsafe meeting link %s', (url) => {
    expect(() => PeerPracticeSession.assertMeetingUrl(url)).toThrow(RangeError);
  });

  it('accepts a secure external meeting link', () => {
    expect(() => PeerPracticeSession.assertMeetingUrl('https://meet.example.com/room')).not.toThrow();
  });

  it.each([
    [past, 60, 'UTC'],
    [future, 10, 'UTC'],
    [future, 60, 'Invalid/Zone'],
  ])('rejects invalid schedule values', (startsAt, duration, timeZone) => {
    expect(() => PeerPracticeSession.assertSchedule(startsAt, duration, timeZone, now)).toThrow(RangeError);
  });

  it('lets only the invitee accept a pending session', () => {
    expect(() => PeerPracticeSession.assertTransition('PENDING', 'ACCEPTED', 'INVITEE', future, now)).not.toThrow();
    expect(() => PeerPracticeSession.assertTransition('PENDING', 'ACCEPTED', 'ORGANIZER', future, now)).toThrow(RangeError);
  });

  it('rejects completion before the scheduled start', () => {
    expect(() => PeerPracticeSession.assertTransition('ACCEPTED', 'COMPLETED', 'ORGANIZER', future, now)).toThrow(RangeError);
  });

  it('allows either participant to complete a started accepted session', () => {
    expect(() => PeerPracticeSession.assertTransition('ACCEPTED', 'COMPLETED', 'INVITEE', past, now)).not.toThrow();
  });

  it('rejects transitions from terminal states', () => {
    expect(() => PeerPracticeSession.assertTransition('COMPLETED', 'CANCELLED', 'ORGANIZER', past, now)).toThrow(RangeError);
  });
});
