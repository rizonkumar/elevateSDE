import { InterviewReadinessDetail } from '../_components/InterviewReadinessDetail';

interface InterviewReadinessPlanPageProps {
  params: Promise<{ planId: string }>;
}

export default async function InterviewReadinessPlanPage({ params }: Readonly<InterviewReadinessPlanPageProps>) {
  const { planId } = await params;
  return <InterviewReadinessDetail planId={planId} />;
}
