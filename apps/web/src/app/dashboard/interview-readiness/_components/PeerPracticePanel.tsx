'use client';

import * as React from 'react';
import { CalendarClock, Check, ExternalLink, UserRoundPlus, X } from 'lucide-react';
import { Badge, Button, DatePicker, Input, Modal, Select, Textarea } from '@elevatesde/ui';
import type {
  InterviewPreparationPlanDto,
  PeerPracticeSessionDto,
  SubmitPeerScorecardDto,
} from '@elevatesde/shared-types';
import { useAuthStore } from '@/store/auth.store';
import { useInterviewReadinessStore } from '@/store/interview-readiness.store';

interface ScheduleModalProps {
  plan: InterviewPreparationPlanDto;
  session: PeerPracticeSessionDto | null;
  open: boolean;
  onClose: () => void;
}

function defaultStart(): string {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(18, 0, 0, 0);
  return start.toISOString();
}

function ScheduleModal({ plan, session, open, onClose }: ScheduleModalProps) {
  const createPeerSession = useInterviewReadinessStore((state) => state.createPeerSession);
  const reschedulePeerSession = useInterviewReadinessStore((state) => state.reschedulePeerSession);
  const isSaving = useInterviewReadinessStore((state) => state.isSaving);
  const [roundId, setRoundId] = React.useState(plan.rounds[0]?.id ?? '');
  const [email, setEmail] = React.useState('');
  const [startsAt, setStartsAt] = React.useState<string | null>(defaultStart());
  const [timeZone, setTimeZone] = React.useState('UTC');
  const [duration, setDuration] = React.useState('60');
  const [meetingUrl, setMeetingUrl] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setRoundId(session?.roundId ?? plan.rounds[0]?.id ?? '');
    setEmail('');
    setStartsAt(session?.startsAt ?? defaultStart());
    setTimeZone(session?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
    setDuration(String(session?.durationMinutes ?? 60));
    setMeetingUrl(session?.meetingUrl ?? '');
  }, [open, plan.rounds, session]);

  const save = async () => {
    if (!startsAt || !meetingUrl || !roundId) return;
    const input = {
      startsAt,
      timeZone,
      durationMinutes: Number(duration),
      meetingUrl,
    };
    const saved = session
      ? await reschedulePeerSession(session, input)
      : await createPeerSession(plan.id, { ...input, roundId, inviteeEmail: email });
    if (saved) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={session ? 'Reschedule peer practice' : 'Schedule peer practice'}
      description="Use an external HTTPS meeting room. ElevateSDE does not record the call."
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Interview round"
          value={roundId}
          options={plan.rounds.map((round) => ({ value: round.id, label: round.title }))}
          onChange={setRoundId}
          disabled={Boolean(session)}
        />
        {!session && (
          <Input
            label="Candidate email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="peer@example.com"
          />
        )}
        <DatePicker label="Date and time" value={startsAt} onChange={setStartsAt} withTime />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Time zone" value={timeZone} onChange={(event) => setTimeZone(event.target.value)} />
          <Input label="Duration in minutes" type="number" min="15" max="180" value={duration} onChange={(event) => setDuration(event.target.value)} />
        </div>
        <Input label="HTTPS meeting link" type="url" value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} placeholder="https://meet.example.com/room" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="tertiary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => void save()} disabled={isSaving || !startsAt || !meetingUrl || (!session && !email)}>
            {isSaving ? 'Saving…' : session ? 'Send updated time' : 'Send invitation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface ScorecardModalProps {
  session: PeerPracticeSessionDto | null;
  open: boolean;
  onClose: () => void;
}

export function ScorecardModal({ session, open, onClose }: ScorecardModalProps) {
  const submit = useInterviewReadinessStore((state) => state.submitPeerScorecard);
  const [scores, setScores] = React.useState({ communication: 80, problemSolving: 80, technicalDepth: 80, structure: 80 });
  const [strengths, setStrengths] = React.useState('');
  const [improvements, setImprovements] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setScores({ communication: 80, problemSolving: 80, technicalDepth: 80, structure: 80 });
    setStrengths('');
    setImprovements('');
  }, [open]);

  const save = async () => {
    if (!session || !strengths.trim() || !improvements.trim()) return;
    const input: SubmitPeerScorecardDto = {
      ...scores,
      strengths: [strengths.trim()],
      improvements: [improvements.trim()],
    };
    if (await submit(session.id, input)) onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Peer scorecard" description="Share specific, constructive feedback. Your private preparation notes are never included.">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(scores) as Array<keyof typeof scores>).map((key) => (
            <Input
              key={key}
              label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase())}
              type="number"
              min="0"
              max="100"
              value={scores[key]}
              onChange={(event) => setScores((current) => ({ ...current, [key]: Number(event.target.value) }))}
            />
          ))}
        </div>
        <Textarea label="Strength" value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder="What worked well?" />
        <Textarea label="Improvement" value={improvements} onChange={(event) => setImprovements(event.target.value)} placeholder="What should they try next time?" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="tertiary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => void save()} disabled={!strengths.trim() || !improvements.trim()}>Submit feedback</Button>
        </div>
      </div>
    </Modal>
  );
}

export function PeerSessionCard({
  session,
  currentUserId,
  onReschedule,
  onScorecard,
}: {
  session: PeerPracticeSessionDto;
  currentUserId: string | undefined;
  onReschedule: () => void;
  onScorecard: () => void;
}) {
  const updateStatus = useInterviewReadinessStore((state) => state.updatePeerSessionStatus);
  const organizer = session.organizer.id === currentUserId;
  const other = organizer ? session.invitee : session.organizer;
  const submitted = session.scorecards.some((scorecard) => scorecard.evaluator.id === currentUserId);
  return (
    <article className="rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-bg-soft) p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-(--color-text-primary)">{other.displayName}</div>
          <div className="mt-1 text-xs text-(--color-text-muted)">{new Date(session.startsAt).toLocaleString(undefined, { timeZone: session.timeZone })} · {session.durationMinutes} min</div>
        </div>
        <Badge variant={session.status === 'ACCEPTED' || session.status === 'COMPLETED' ? 'success' : session.status === 'DECLINED' || session.status === 'CANCELLED' ? 'danger' : 'neutral'}>
          {session.status.toLowerCase().replaceAll('_', ' ')}
        </Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {session.status === 'PENDING' && !organizer && (
          <>
            <Button className="h-8" onClick={() => void updateStatus(session, 'ACCEPTED')}><Check className="h-3.5 w-3.5" />Accept</Button>
            <Button className="h-8" variant="secondary" onClick={() => void updateStatus(session, 'DECLINED')}><X className="h-3.5 w-3.5" />Decline</Button>
          </>
        )}
        {['PENDING', 'ACCEPTED'].includes(session.status) && organizer && <Button className="h-8" variant="secondary" onClick={onReschedule}>Reschedule</Button>}
        {['PENDING', 'ACCEPTED'].includes(session.status) && <Button className="h-8" variant="tertiary" onClick={() => void updateStatus(session, 'CANCELLED')}>Cancel</Button>}
        {session.status === 'ACCEPTED' && (
          <>
            <a href={session.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-(--radius-sm) bg-(--color-text-primary) px-3 text-xs font-medium text-(--color-bg)">Join room<ExternalLink className="h-3.5 w-3.5" /></a>
            <Button className="h-8" variant="secondary" onClick={() => void updateStatus(session, 'COMPLETED')}>Complete</Button>
            <Button className="h-8" variant="tertiary" onClick={() => void updateStatus(session, 'NO_SHOW')}>No-show</Button>
          </>
        )}
        {session.status === 'COMPLETED' && !submitted && <Button className="h-8" onClick={onScorecard}>Share feedback</Button>}
      </div>
    </article>
  );
}

export function PeerPracticePanel({ plan }: { plan: InterviewPreparationPlanDto }) {
  const userId = useAuthStore((state) => state.user?.id);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [editingSession, setEditingSession] = React.useState<PeerPracticeSessionDto | null>(null);
  const [scorecardSession, setScorecardSession] = React.useState<PeerPracticeSessionDto | null>(null);
  return (
    <section className="rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)"><UserRoundPlus className="h-4 w-4 text-(--color-accent)" />Peer practice</div>
          <p className="mb-0 mt-1 text-xs">Schedule a private session with an existing candidate using your own meeting link.</p>
        </div>
        <Button variant="secondary" onClick={() => { setEditingSession(null); setScheduleOpen(true); }}><CalendarClock className="h-4 w-4" />Schedule</Button>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {plan.peerSessions.map((session) => (
          <PeerSessionCard
            key={session.id}
            session={session}
            currentUserId={userId}
            onReschedule={() => { setEditingSession(session); setScheduleOpen(true); }}
            onScorecard={() => setScorecardSession(session)}
          />
        ))}
        {plan.peerSessions.length === 0 && <div className="rounded-(--radius-md) border border-dashed border-(--color-border) p-5 text-sm text-(--color-text-muted)">No peer sessions scheduled.</div>}
      </div>
      <ScheduleModal plan={plan} session={editingSession} open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      <ScorecardModal session={scorecardSession} open={Boolean(scorecardSession)} onClose={() => setScorecardSession(null)} />
    </section>
  );
}
