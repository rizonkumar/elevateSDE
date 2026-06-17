'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Send } from 'lucide-react';
import { Badge, Button, Input } from '@elevatesde/ui';
import { ROLE_LABELS, STYLE_LABELS, TOPIC_LABELS } from '@/lib/interview-engine';
import { useMockInterviewStore } from '@/store/mock-interview.store';
import { InterviewerWaveform } from './InterviewerWaveform';
import { SessionTimer } from './SessionTimer';
import { TranscriptStream } from './TranscriptStream';

export function InterviewConsole() {
  const {
    config,
    transcript,
    isAiSpeaking,
    isMicActive,
    micLevel,
    remainingSeconds,
    speechSupported,
    toggleMic,
    submitTypedAnswer,
    end,
  } = useMockInterviewStore();
  const [draft, setDraft] = React.useState('');

  if (!config) return null;

  const handleSend = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.trim().length === 0) return;
    submitTypedAnswer(draft);
    setDraft('');
  };

  const handleMicToggle = () => {
    toggleMic().catch(() => undefined);
  };

  let statusLabel: string;
  if (isAiSpeaking) {
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

        <div className="flex flex-col items-center gap-4 py-4">
          <InterviewerWaveform
            micLevel={micLevel}
            isAiSpeaking={isAiSpeaking}
            isMicActive={isMicActive}
          />
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-(--color-text-muted)">
            {statusLabel}
          </span>
        </div>

        {speechSupported ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant={isMicActive ? 'secondary' : 'primary'}
              onClick={handleMicToggle}
            >
              <span className="inline-flex items-center gap-2">
                {isMicActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isMicActive ? 'Stop microphone' : 'Start microphone'}
              </span>
            </Button>
            <Button variant="secondary" onClick={end}>
              <span className="inline-flex items-center gap-2">
                <PhoneOff className="h-4 w-4" />
                End interview
              </span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <Input
                label="Your answer"
                placeholder="Type your response and press send"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <Button type="submit" className="shrink-0">
                <span className="inline-flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send
                </span>
              </Button>
            </form>
            <Button variant="secondary" className="self-center" onClick={end}>
              <span className="inline-flex items-center gap-2">
                <PhoneOff className="h-4 w-4" />
                End interview
              </span>
            </Button>
          </div>
        )}
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
