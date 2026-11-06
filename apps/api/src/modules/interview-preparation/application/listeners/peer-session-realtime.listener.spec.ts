import { PeerSessionRealtimeListener } from './peer-session-realtime.listener';
import { RecordingRealtimePublisher } from '../../../realtime/testing/recording-realtime.publisher';

describe('PeerSessionRealtimeListener', () => {
  it('pushes the new status to the peer session room', () => {
    const realtime = new RecordingRealtimePublisher();
    const listener = new PeerSessionRealtimeListener(realtime);

    listener.onPeerSessionChanged({
      recipientId: 'u2',
      planId: 'plan-1',
      sessionId: 'session-1',
      status: 'RESCHEDULED',
      dedupeKey: 'k',
    });

    expect(realtime.events).toEqual([
      {
        target: 'peer',
        id: 'session-1',
        event: 'peer:session-changed',
        payload: { sessionId: 'session-1', status: 'RESCHEDULED' },
      },
    ]);
  });

  it('ignores unknown statuses', () => {
    const realtime = new RecordingRealtimePublisher();
    new PeerSessionRealtimeListener(realtime).onPeerSessionChanged({
      recipientId: 'u2',
      planId: 'plan-1',
      sessionId: 'session-1',
      status: 'SOMETHING_ELSE',
      dedupeKey: 'k',
    });
    expect(realtime.events).toHaveLength(0);
  });
});
