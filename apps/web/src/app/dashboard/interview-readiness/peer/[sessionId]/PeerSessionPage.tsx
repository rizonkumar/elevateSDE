'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/auth.store';
import { useInterviewReadinessStore } from '@/store/interview-readiness.store';
import { PeerSessionCard, ScorecardModal } from '../../_components/PeerPracticePanel';

export function PeerSessionPage({ sessionId }: { sessionId: string }) {
  const userId = useAuthStore((state) => state.user?.id);
  const { peerSession, isLoading, error, loadPeerSession } = useInterviewReadinessStore();
  const [scorecardOpen, setScorecardOpen] = React.useState(false);

  React.useEffect(() => {
    void loadPeerSession(sessionId);
  }, [loadPeerSession, sessionId]);

  if (isLoading || !peerSession) {
    return (
      <PageContainer>
        {error ? (
          <div className="rounded-(--radius-md) border border-(--color-danger)/20 bg-(--color-danger-soft) p-6">
            <h1 className="text-lg font-semibold text-(--color-text-primary)">Peer session unavailable</h1>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : (
          <div className="h-72 animate-pulse rounded-(--radius-lg) bg-(--color-badge-bg)" aria-label="Loading peer session" />
        )}
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex max-w-3xl flex-col gap-7">
        <Link href="/dashboard/interview-readiness" className="inline-flex items-center gap-2 self-start text-sm font-medium text-(--color-text-muted)">
          <ArrowLeft className="h-4 w-4" />
          Interview readiness
        </Link>
        <PageHeader kicker="Private peer practice" title="Practice session" description="Only the organizer and invitee can access this schedule and its feedback." />
        <PeerSessionCard
          session={peerSession}
          currentUserId={userId}
          onReschedule={() => undefined}
          onScorecard={() => setScorecardOpen(true)}
        />
        <div className="flex items-start gap-3 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-bg-soft) p-4 text-xs text-(--color-text-muted)">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)" />
          Calls happen through the external meeting link. ElevateSDE does not record audio or video.
        </div>
      </div>
      <ScorecardModal session={peerSession} open={scorecardOpen} onClose={() => setScorecardOpen(false)} />
    </PageContainer>
  );
}
