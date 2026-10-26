import { MockInterviewSessionDetail } from '../_components/MockInterviewSessionDetail';

interface MockInterviewSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function MockInterviewSessionPage({ params }: MockInterviewSessionPageProps) {
  const { sessionId } = await params;
  return <MockInterviewSessionDetail sessionId={sessionId} />;
}
