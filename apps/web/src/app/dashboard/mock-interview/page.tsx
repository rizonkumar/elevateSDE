import { MockInterviewWorkspace } from './_components/MockInterviewWorkspace';

interface MockInterviewPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function MockInterviewPage({ searchParams }: MockInterviewPageProps) {
  const params = await searchParams;
  return (
    <MockInterviewWorkspace
      preparationTaskId={firstValue(params.taskId)}
      initialTopic={firstValue(params.topic)}
    />
  );
}
