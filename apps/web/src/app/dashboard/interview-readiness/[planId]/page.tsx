import { InterviewReadinessDetail } from '../_components/InterviewReadinessDetail';

interface InterviewReadinessPlanPageProps {
  params: Promise<{ planId: string }>;
}

export default async function InterviewReadinessPlanPage({ params }: InterviewReadinessPlanPageProps) {
  const { planId } = await params;
  return <InterviewReadinessDetail planId={planId} />;
}
