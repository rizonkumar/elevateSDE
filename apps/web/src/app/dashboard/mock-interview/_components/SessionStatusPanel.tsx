'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, RotateCcw, TimerOff } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import type { MockInterviewSessionDto } from '@elevatesde/shared-types';

interface SessionStatusPanelProps {
  readonly session: MockInterviewSessionDto;
  readonly onReset?: () => void;
}

const COPY = {
  SCORING: {
    icon: Loader2,
    title: 'Scoring your interview',
    body: 'We are compiling your rubric scores and writing your debrief. This usually takes a few seconds.',
  },
  FAILED: {
    icon: AlertTriangle,
    title: 'We could not score this interview',
    body: 'Something went wrong while preparing your report. Your answers are saved; try another session.',
  },
  ABANDONED: {
    icon: TimerOff,
    title: 'Interview ended without answers',
    body: 'No answers were recorded, so there is nothing to score. Start a new round when you are ready.',
  },
} as const;

export function SessionStatusPanel({ session, onReset }: SessionStatusPanelProps) {
  if (session.status !== 'SCORING' && session.status !== 'FAILED' && session.status !== 'ABANDONED') {
    return null;
  }
  const copy = COPY[session.status];
  const Icon = copy.icon;
  const isScoring = session.status === 'SCORING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="card flex flex-col items-center gap-4 py-12 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
        <Icon className={`h-5 w-5 ${isScoring ? 'animate-spin' : ''}`} />
      </span>
      <div className="flex max-w-md flex-col gap-1.5">
        <h2 className="m-0 font-display text-lg font-semibold tracking-tight text-(--color-text-primary)">
          {copy.title}
        </h2>
        <p className="m-0 text-sm leading-relaxed text-(--color-text-muted)">
          {session.failureReason ?? copy.body}
        </p>
      </div>
      {!isScoring &&
        (onReset ? (
          <Button onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Start new interview
          </Button>
        ) : (
          <Link href="/dashboard/mock-interview" className="text-sm font-medium text-(--color-accent)">
            Start new interview
          </Link>
        ))}
    </motion.div>
  );
}
