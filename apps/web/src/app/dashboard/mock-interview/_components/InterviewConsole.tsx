'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Send } from 'lucide-react';
import { Badge, Button, Textarea } from '@elevatesde/ui';
import { MOCK_INTERVIEW_MAX_ANSWER_LENGTH } from '@elevatesde/shared-types';
import { ROLE_LABELS, STYLE_LABELS, TOPIC_LABELS } from '@/lib/mock-interview-options';
import { useMockInterviewStore } from '@/store/mock-interview.store';
import { InterviewerWaveform } from './InterviewerWaveform';
import { SessionTimer } from './SessionTimer';
import { TranscriptStream } from './TranscriptStream';

export function InterviewConsole() {
  const {
    session,
    transcript,
    isThinking,
    isAiSpeaking,
    isMicActive,
    micLevel,
    remainingSeconds,
    speechSupported,
    toggleMic,
    submitAnswer,
    end,
  } = useMockInterviewStore();
  const [draft, setDraft] = React.useState('');

  if (!session) return null;
  const { config } = session;
  const questionNumber = session.turns.length;

  const handleSend = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const answer = draft.trim();
    if (answer.length === 0 || isThinking) return;
    setDraft('');
    void submitAnswer(answer);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleMicToggle = () => {
    toggleMic().catch(() => undefined);
  };

  let statusLabel: string;
  if (isThinking) {
    statusLabel = 'Interviewer is evaluating your answer';
  } else if (isAiSpeaking) {
    statusLabel = 'Interviewer is speaking';
  } else if (isMicActive) {
    statusLabel = 'Listening — answer now';
  } else {
    statusLabel = 'Your turn';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="card flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{TOPIC_LABELS[config.topic]}</Badge>
            <Badge variant="neutral">{ROLE_LABELS[config.roleLevel]}</Badge>
            <Badge variant="neutral">{STYLE_LABELS[config.companyStyle]}</Badge>
          </div>
          <SessionTimer remainingSeconds={remainingSeconds} />
        </div>

        <div className="flex flex-col items-center gap-4 py-2">
          <InterviewerWaveform
            micLevel={micLevel}
            isAiSpeaking={isAiSpeaking || isThinking}
            isMicActive={isMicActive}
          />
          <span
            className="text-xs font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)"
            aria-live="polite"
          >
            {statusLabel}
          </span>
          <span className="text-xs text-(--color-text-muted)">
            Question {questionNumber} of up to {session.maxTurns}
          </span>
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-3">
          <Textarea
            label="Your answer"
            placeholder="Type your response. Press ⌘/Ctrl + Enter to send."
            value={draft}
            rows={4}
            maxLength={MOCK_INTERVIEW_MAX_ANSWER_LENGTH}
            disabled={isThinking}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs tabular-nums text-(--color-text-muted)">
              {draft.length}/{MOCK_INTERVIEW_MAX_ANSWER_LENGTH}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {speechSupported && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleMicToggle}
                  disabled={isThinking}
                >
                  {isMicActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isMicActive ? 'Stop microphone' : 'Answer by voice'}
                </Button>
              )}
              <Button type="submit" disabled={isThinking || draft.trim().length === 0}>
                <Send className="h-4 w-4" />
                {isThinking ? 'Evaluating…' : 'Send answer'}
              </Button>
            </div>
          </div>
        </form>

        <Button
          variant="tertiary"
          className="self-center"
          onClick={() => void end()}
          disabled={isThinking}
        >
          <PhoneOff className="h-4 w-4" />
          End interview
        </Button>
      </div>

      <div className="card flex h-112 flex-col gap-3 lg:h-auto">
        <h3 className="m-0 text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
          Live transcript
        </h3>
        <div className="min-h-0 flex-1">
          <TranscriptStream transcript={transcript} />
        </div>
      </div>
    </motion.div>
  );
}
