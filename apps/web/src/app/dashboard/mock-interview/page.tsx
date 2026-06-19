'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useMockInterviewStore } from '@/store/mock-interview.store';
import { InterviewSetup } from './_components/InterviewSetup';
import { InterviewConsole } from './_components/InterviewConsole';
import { FeedbackReport } from './_components/FeedbackReport';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';

export default function MockInterviewPage() {
  const { status, feedback } = useMockInterviewStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function renderContent(): React.ReactNode {
    if (status === 'ACTIVE') return <InterviewConsole />;
    if (status === 'COMPLETED' && feedback) return <FeedbackReport feedback={feedback} />;
    return <InterviewSetup />;
  }

  return (
    <PageContainer>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-8"
        >
          <PageHeader
            kicker="Mock interview"
            title="AI Interview Console"
            description="Practice realistic technical and behavioral rounds with an AI interviewer, then review a scored breakdown of your performance."
          />
        </motion.div>

        {mounted ? renderContent() : (
          <div className="flex items-center justify-center py-24 text-sm text-(--color-text-muted)">
            Loading…
          </div>
        )}
    </PageContainer>
  );
}
