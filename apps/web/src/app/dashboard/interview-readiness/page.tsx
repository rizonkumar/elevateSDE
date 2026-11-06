import { InterviewReadinessOverview } from './_components/InterviewReadinessOverview';

interface InterviewReadinessPageProps {
  searchParams: Promise<{ application?: string }>;
}

export default async function InterviewReadinessPage({ searchParams }: Readonly<InterviewReadinessPageProps>) {
  const { application } = await searchParams;
  return <InterviewReadinessOverview initialApplicationId={application} />;
}
