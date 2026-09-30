import { PeerSessionPage } from './PeerSessionPage';

interface PeerPracticePageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function PeerPracticePage({ params }: PeerPracticePageProps) {
  const { sessionId } = await params;
  return <PeerSessionPage sessionId={sessionId} />;
}
