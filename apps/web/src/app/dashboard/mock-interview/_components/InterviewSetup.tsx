'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Mic2, MessageSquare, Clock, Sparkles } from 'lucide-react';
import { Button, Select } from '@elevatesde/ui';
import type {
  InterviewCompanyStyle,
  InterviewConfig,
  InterviewRoleLevel,
  MockInterviewTopic,
} from '@elevatesde/shared-types';
import {
  DURATION_OPTIONS,
  ROLE_OPTIONS,
  STYLE_OPTIONS,
  TOPIC_OPTIONS,
} from '@/lib/interview-engine';
import { useMockInterviewStore } from '@/store/mock-interview.store';

const EXPECTATIONS = [
  { icon: MessageSquare, text: 'An AI interviewer asks role-specific questions and follow-ups.' },
  { icon: Mic2, text: 'Answer by voice or type — your responses appear in the live transcript.' },
  { icon: Clock, text: 'A countdown keeps the session realistic and focused.' },
  { icon: Sparkles, text: 'Get a scored feedback report when the round ends.' },
];

export function InterviewSetup() {
  const start = useMockInterviewStore((state) => state.start);
  const [topic, setTopic] = React.useState<MockInterviewTopic>('SYSTEM_DESIGN');
  const [roleLevel, setRoleLevel] = React.useState<InterviewRoleLevel>('SENIOR');
  const [companyStyle, setCompanyStyle] = React.useState<InterviewCompanyStyle>('FAANG');
  const [durationMinutes, setDurationMinutes] = React.useState(20);

  const handleStart = () => {
    const config: InterviewConfig = { topic, roleLevel, companyStyle, durationMinutes };
    start(config);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <div className="card flex flex-col gap-5">
        <div>
          <h2 className="m-0 font-display text-lg font-semibold tracking-tight text-(--color-text-primary)">
            Configure your round
          </h2>
          <p className="m-0 mt-1 text-sm text-(--color-text-muted)">
            Tailor the interviewer to the role you are preparing for.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Topic"
            value={topic}
            options={TOPIC_OPTIONS}
            onChange={(value) => setTopic(value as MockInterviewTopic)}
          />
          <Select
            label="Role level"
            value={roleLevel}
            options={ROLE_OPTIONS}
            onChange={(value) => setRoleLevel(value as InterviewRoleLevel)}
          />
          <Select
            label="Company style"
            value={companyStyle}
            options={STYLE_OPTIONS}
            onChange={(value) => setCompanyStyle(value as InterviewCompanyStyle)}
          />
          <Select
            label="Duration"
            value={String(durationMinutes)}
            options={DURATION_OPTIONS}
            onChange={(value) => setDurationMinutes(Number(value))}
          />
        </div>

        <Button className="w-full sm:w-auto sm:self-start" onClick={handleStart}>
          <span className="inline-flex items-center gap-2">
            <Mic2 className="h-4 w-4" />
            Start interview
          </span>
        </Button>
      </div>

      <div className="card flex flex-col gap-4">
        <h3 className="m-0 text-sm font-semibold uppercase tracking-wider text-(--color-text-muted)">
          What to expect
        </h3>
        <ul className="m-0 flex flex-col gap-4 p-0">
          {EXPECTATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.text} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm leading-relaxed text-(--color-text-primary)">
                  {item.text}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}
