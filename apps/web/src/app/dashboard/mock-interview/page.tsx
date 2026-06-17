'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useMockInterviewStore } from '@/store/mock-interview.store';
import { InterviewSetup } from './_components/InterviewSetup';
import { InterviewConsole } from './_components/InterviewConsole';
import { FeedbackReport } from './_components/FeedbackReport';

export default function MockInterviewPage() {
  const { status, feedback } = useMockInterviewStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent) mb-2">
            Mock interview
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            AI Interview Console
          </h1>
          <p className="text-sm text-(--color-text-muted) mt-1.5 mb-0 max-w-xl">
            Practice realistic technical and behavioral rounds with an AI interviewer, then review a
            scored breakdown of your performance.
          </p>
        </motion.header>

        {!mounted ? (
          <div className="flex items-center justify-center py-24 text-sm text-(--color-text-muted)">
            Loading…
          </div>
        ) : status === 'ACTIVE' ? (
          <InterviewConsole />
        ) : status === 'COMPLETED' && feedback ? (
          <FeedbackReport feedback={feedback} />
        ) : (
          <InterviewSetup />
        )}
    </div>
  );
}
