import { PeerSessionPage } from './PeerSessionPage';

interface PeerPracticePageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function PeerPracticePage({ params }: Readonly<PeerPracticePageProps>) {
  const { sessionId } = await params;
  return <PeerSessionPage sessionId={sessionId} />;
}
